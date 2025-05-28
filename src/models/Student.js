class Student {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.isAttentive = true;
        this.lastUpdate = Date.now();
        this.attentionHistory = [];
        this.totalAttentiveTime = 0;
        this.totalSessionTime = 0;
    }

    updateAttention(direction) {
        const prevAttentive = this.isAttentive;
        this.isAttentive = direction === 'center';
        const now = Date.now();
        const duration = now - this.lastUpdate;
        this.lastUpdate = now;
        
        this.attentionHistory.push({
            timestamp: now,
            isAttentive: this.isAttentive,
            direction,
            duration
        });

        // Keep only last 100 records
        if (this.attentionHistory.length > 100) {
            this.attentionHistory.shift();
        }

        if (prevAttentive) {
            this.totalAttentiveTime += duration;
        }
        this.totalSessionTime += duration;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            isAttentive: this.isAttentive,
            lastUpdate: this.lastUpdate,
            totalAttentiveTime: this.totalAttentiveTime,
            totalSessionTime: this.totalSessionTime,
            attentionPercentage: (this.totalAttentiveTime / this.totalSessionTime) * 100
        };
    }
}

module.exports = Student; 