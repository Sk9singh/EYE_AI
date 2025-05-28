const Student = require('../models/Student');

class StudentController {
    constructor(dashboard) {
        this.students = new Map();
        this.dashboard = dashboard;
    }

    joinStudent(studentId, name) {
        const student = new Student(studentId, name);
        this.students.set(studentId, student);
        this.dashboard.updateStats(this.students);
        return student;
    }

    leaveStudent(studentId) {
        this.students.delete(studentId);
        this.dashboard.updateStats(this.students);
    }

    updateAttention(studentId, direction) {
        const student = this.students.get(studentId);
        if (student) {
            student.updateAttention(direction);
            this.dashboard.updateStats(this.students);
            console.log(`Student ${studentId}: ${student.isAttentive ? 'Attentive' : 'Distracted'} - Looking ${direction}`);
        }
    }

    getDashboardData() {
        return {
            ...this.dashboard.toJSON(),
            students: Array.from(this.students.values()).map(student => student.toJSON())
        };
    }
}

module.exports = StudentController; 