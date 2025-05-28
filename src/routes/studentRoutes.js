const express = require('express');
const router = express.Router();

function createStudentRoutes(studentController) {
    router.post('/join', (req, res) => {
        const { studentId, name } = req.body;
        studentController.joinStudent(studentId, name);
        res.json({ status: 'joined' });
    });

    router.post('/leave', (req, res) => {
        const { studentId } = req.body;
        studentController.leaveStudent(studentId);
        res.json({ status: 'left' });
    });

    router.post('/trigger', (req, res) => {
        const { direction, duration, studentId } = req.body;
        studentController.updateAttention(studentId, direction);
        res.sendStatus(200);
    });

    router.get('/dashboard', (req, res) => {
        res.json(studentController.getDashboardData());
    });

    return router;
}

module.exports = createStudentRoutes; 