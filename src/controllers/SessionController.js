const Session = require('../models/Session');

class SessionController {
    constructor(socketService) {
        this.activeSessions = new Map(); // teacherId -> sessionId
        this.socketService = socketService;
    }

    async createSession(teacherId) {
        const session = new Session({ teacherId });
        await session.save();
        this.activeSessions.set(teacherId, session._id);
        this.socketService.emitSessionStart(teacherId, session._id);
        return session;
    }

    async endSession(teacherId) {
        const sessionId = this.activeSessions.get(teacherId);
        if (sessionId) {
            const session = await Session.findById(sessionId);
            if (session) {
                // Calculate final attention metrics for all students
                const endTime = new Date();
                session.students.forEach(student => {
                    this.calculateStudentAttentionMetrics(student, endTime);
                });
                
                session.endTime = endTime;
                session.isActive = false;
                await session.save();
            }
            this.activeSessions.delete(teacherId);
            this.socketService.emitSessionEnd(teacherId);
        }
    }

    calculateStudentAttentionMetrics(student, currentTime) {
        if (!student.attentionRecords || student.attentionRecords.length === 0) {
            student.totalAttentiveTime = 0;
            student.totalSessionTime = 0;
            student.attentionPercentage = 0;
            return;
        }

        // Sort records by timestamp
        const sortedRecords = student.attentionRecords.sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
        );

        let totalAttentiveTime = 0;
        let lastTimestamp = sortedRecords[0].timestamp;
        let wasAttentive = sortedRecords[0].isAttentive;

        // Calculate duration for each attention state
        for (let i = 1; i < sortedRecords.length; i++) {
            const currentRecord = sortedRecords[i];
            const duration = currentRecord.timestamp.getTime() - lastTimestamp.getTime();
            
            if (wasAttentive) {
                totalAttentiveTime += duration;
            }
            
            lastTimestamp = currentRecord.timestamp;
            wasAttentive = currentRecord.isAttentive;
        }

        // Add duration for the last state until current time
        const finalDuration = currentTime.getTime() - lastTimestamp.getTime();
        if (wasAttentive) {
            totalAttentiveTime += finalDuration;
        }

        // Calculate total session time
        const totalSessionTime = currentTime.getTime() - sortedRecords[0].timestamp.getTime();

        // Update student metrics with validation
        student.totalAttentiveTime = Math.max(0, totalAttentiveTime);
        student.totalSessionTime = Math.max(0, totalSessionTime);
        
        // Calculate attention percentage with validation
        if (student.totalSessionTime > 0) {
            student.attentionPercentage = (student.totalAttentiveTime / student.totalSessionTime) * 100;
        } else {
            student.attentionPercentage = 0;
        }
    }

    async addStudent(teacherId, studentId, studentName) {
        const sessionId = this.activeSessions.get(teacherId);
        if (!sessionId) return null;

        const session = await Session.findById(sessionId);
        if (!session) return null;

        const studentData = {
            studentId,
            studentName,
            attentionRecords: [],
            cameraStatus: 'inactive',
            totalAttentiveTime: 0,
            totalSessionTime: 0,
            attentionPercentage: 0
        };

        session.students.push(studentData);
        await session.save();

        this.socketService.emitStudentJoined(teacherId, {
            studentId,
            studentName,
            joinedAt: new Date()
        });

        await this.updateGraphMetrics(teacherId);

        return session;
    }

    async updateAttention(teacherId, studentId, direction) {
        const sessionId = this.activeSessions.get(teacherId);
        if (!sessionId) return null;

        const session = await Session.findById(sessionId);
        if (!session) return null;

        const student = session.students.find(s => s.studentId === studentId);
        if (!student) return null;

        const isAttentive = direction === 'center';
        const now = new Date();
        
        // Calculate duration for the previous attention state
        if (student.attentionRecords.length > 0) {
            const lastRecord = student.attentionRecords[student.attentionRecords.length - 1];
            const duration = now.getTime() - lastRecord.timestamp.getTime();
            lastRecord.duration = Math.max(0, duration);
        }

        const attentionRecord = {
            direction,
            isAttentive,
            timestamp: now,
            duration: 0
        };

        student.attentionRecords.push(attentionRecord);
        student.lastUpdate = now;

        // Calculate updated attention metrics
        this.calculateStudentAttentionMetrics(student, now);

        try {
            await session.save();
        } catch (error) {
            console.error('Error saving session:', error);
            throw new Error('Failed to update attention');
        }

        // Emit attention metrics update
        this.socketService.emitAttentionMetrics(teacherId, {
            studentId,
            studentName: student.studentName,
            totalAttentiveTime: student.totalAttentiveTime,
            totalSessionTime: student.totalSessionTime,
            attentionPercentage: student.attentionPercentage
        });

        await this.updateGraphMetrics(teacherId);

        return {
            studentId,
            studentName: student.studentName,
            isAttentive,
            direction,
            timestamp: now,
            totalAttentiveTime: student.totalAttentiveTime,
            totalSessionTime: student.totalSessionTime,
            attentionPercentage: student.attentionPercentage
        };
    }

    async updateCameraStatus(teacherId, studentId, status) {
        const sessionId = this.activeSessions.get(teacherId);
        if (!sessionId) return null;

        const session = await Session.findById(sessionId);
        if (!session) return null;

        const student = session.students.find(s => s.studentId === studentId);
        if (!student) return null;

        student.cameraStatus = status;
        student.lastUpdate = new Date();
        await session.save();

        await this.updateGraphMetrics(teacherId);

        return {
            studentId,
            studentName: student.studentName,
            cameraStatus: status,
            timestamp: new Date()
        };
    }

    async updateGraphMetrics(teacherId) {
        const sessionId = this.activeSessions.get(teacherId);
        if (!sessionId) return null;

        const session = await Session.findById(sessionId);
        if (!session) return null;

        const now = new Date();
        const metrics = {
            timestamp: now,
            attentiveCount: 0,
            inattentiveCount: 0,
            cameraOffCount: 0,
            notDetectedCount: 0
        };

        session.students.forEach(student => {
            if (student.cameraStatus === 'inactive') {
                metrics.cameraOffCount++;
            } else if (student.cameraStatus === 'not_detected') {
                metrics.notDetectedCount++;
            } else {
                const lastAttention = student.attentionRecords[student.attentionRecords.length - 1];
                if (lastAttention && lastAttention.isAttentive) {
                    metrics.attentiveCount++;
                } else {
                    metrics.inattentiveCount++;
                }
            }
        });

        session.graphMetrics.push(metrics);
        await session.save();

        this.socketService.emitGraphMetrics(teacherId, metrics);

        return metrics;
    }

    async getSessionData(teacherId) {
        const sessionId = this.activeSessions.get(teacherId);
        if (!sessionId) return null;

        const session = await Session.findById(sessionId);
        if (!session) return null;

        return {
            sessionId: session._id,
            startTime: session.startTime,
            students: session.students.map(student => ({
                studentId: student.studentId,
                studentName: student.studentName,
                isActive: student.isActive,
                cameraStatus: student.cameraStatus,
                currentAttention: student.attentionRecords[student.attentionRecords.length - 1] || null,
                totalAttentiveTime: student.totalAttentiveTime || 0,
                totalSessionTime: student.totalSessionTime || 0,
                attentionPercentage: student.attentionPercentage || 0
            })),
            graphMetrics: session.graphMetrics
        };
    }
}

module.exports = SessionController; 