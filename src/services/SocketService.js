class SocketService {
    constructor(io) {
        this.io = io;
        this.teacherRooms = new Map(); // teacherId -> roomId
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Teacher joins their room
            socket.on('teacher:join', (teacherId) => {
                const roomId = `teacher_${teacherId}`;
                socket.join(roomId);
                this.teacherRooms.set(teacherId, roomId);
                console.log(`Teacher ${teacherId} joined room ${roomId}`);
            });

            // Student joins teacher's room
            socket.on('student:join', ({ teacherId, studentId, studentName }) => {
                const roomId = this.teacherRooms.get(teacherId);
                if (roomId) {
                    socket.join(roomId);
                    socket.studentId = studentId;
                    socket.studentName = studentName;
                    socket.teacherId = teacherId;
                    console.log(`Student ${studentName} joined room ${roomId}`);
                }
            });

            // Handle attention updates
            socket.on('student:attention', ({ direction, isAttentive }) => {
                if (socket.teacherId && socket.studentId) {
                    const roomId = this.teacherRooms.get(socket.teacherId);
                    if (roomId) {
                        this.io.to(roomId).emit('attention:update', {
                            studentId: socket.studentId,
                            studentName: socket.studentName,
                            direction,
                            isAttentive,
                            timestamp: new Date()
                        });
                    }
                }
            });

            // Handle camera status updates
            socket.on('student:camera', ({ status }) => {
                if (socket.teacherId && socket.studentId) {
                    const roomId = this.teacherRooms.get(socket.teacherId);
                    if (roomId) {
                        this.io.to(roomId).emit('camera:update', {
                            studentId: socket.studentId,
                            studentName: socket.studentName,
                            status,
                            timestamp: new Date()
                        });
                    }
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    // Emit session start to teacher's room
    emitSessionStart(teacherId, sessionId) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('session:start', { sessionId });
        }
    }

    // Emit session end to teacher's room
    emitSessionEnd(teacherId) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('session:end');
            this.teacherRooms.delete(teacherId);
        }
    }

    // Emit student joined to teacher's room
    emitStudentJoined(teacherId, studentData) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('student:joined', studentData);
        }
    }

    // Emit graph metrics update to teacher's room
    emitGraphMetrics(teacherId, metrics) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('graph:metrics', metrics);
        }
    }

    // Emit attention metrics update to teacher's room
    emitAttentionMetrics(teacherId, metrics) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('attention:metrics', metrics);
        }
    }

    // Emit file uploaded notification to teacher's room
    emitFileUploaded(teacherId, fileData) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('file:uploaded', fileData);
        }
    }

    // Emit file deleted notification to teacher's room
    emitFileDeleted(teacherId, fileId) {
        const roomId = this.teacherRooms.get(teacherId);
        if (roomId) {
            this.io.to(roomId).emit('file:deleted', { fileId });
        }
    }
}

module.exports = SocketService; 