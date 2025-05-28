class Dashboard {
    constructor() {
        this.totalStudents = 0;
        this.attentiveStudents = 0;
        this.attentionHistory = [];
    }

    updateStats(students) {
        this.totalStudents = students.size;
        this.attentiveStudents = Array.from(students.values())
            .filter(s => s.isAttentive).length;

        this.attentionHistory.push({
            timestamp: Date.now(),
            attentiveCount: this.attentiveStudents,
            totalStudents: this.totalStudents
        });

        // Keep only last 100 records
        if (this.attentionHistory.length > 100) {
            this.attentionHistory.shift();
        }
    }

    toJSON() {
        return {
            totalStudents: this.totalStudents,
            attentiveStudents: this.attentiveStudents,
            attentionHistory: this.attentionHistory
        };
    }
}

module.exports = Dashboard; 