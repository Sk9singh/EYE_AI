const express = require('express');

function sessionRoutes(sessionController) {
    const router = express.Router();

    // Teacher routes
    router.post('/teacher/start', async (req, res) => {
        try {
            const { teacherId } = req.body;
            const session = await sessionController.createSession(teacherId);
            res.json({ sessionId: session._id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/teacher/end', async (req, res) => {
        try {
            const { teacherId } = req.body;
            await sessionController.endSession(teacherId);
            res.json({ message: 'Session ended successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/teacher/session', async (req, res) => {
        try {
            const { teacherId } = req.query;
            const sessionData = await sessionController.getSessionData(teacherId);
            if (!sessionData) {
                return res.status(404).json({ error: 'No active session found' });
            }
            res.json(sessionData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Student routes
    router.post('/student/join', async (req, res) => {
        try {
            const { teacherId, studentId, studentName } = req.body;
            const session = await sessionController.addStudent(teacherId, studentId, studentName);
            if (!session) {
                return res.status(404).json({ error: 'No active session found' });
            }
            res.json({ message: 'Joined session successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/student/attention', async (req, res) => {
        try {
            const { teacherId, studentId, direction } = req.body;
            const result = await sessionController.updateAttention(teacherId, studentId, direction);
            if (!result) {
                return res.status(404).json({ error: 'No active session found' });
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/student/camera', async (req, res) => {
        try {
            const { teacherId, studentId, status } = req.body;
            const result = await sessionController.updateCameraStatus(teacherId, studentId, status);
            if (!result) {
                return res.status(404).json({ error: 'No active session found' });
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add student leave route
    router.post('/student/leave', async (req, res) => {
        try {
            const { teacherId, studentId } = req.body;
            const result = await sessionController.removeStudent(teacherId, studentId);
            if (!result) {
                return res.status(404).json({ error: 'No active session found' });
            }
            res.json({ message: 'Left session successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add route to get total students count
    router.get('/students/count', async (req, res) => {
        try {
            const { teacherId } = req.query;
            const count = await sessionController.getActiveStudentsCount(teacherId);
            res.json({ count });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = sessionRoutes; 