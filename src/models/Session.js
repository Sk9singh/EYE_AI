const mongoose = require('mongoose');

const attentionRecordSchema = new mongoose.Schema({
    direction: { 
        type: String, 
        required: true,
        enum: ['left', 'right', 'up', 'down', 'center']
    },
    isAttentive: { 
        type: Boolean, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    duration: { 
        type: Number, 
        default: 0 
    }
});

const studentSessionSchema = new mongoose.Schema({
    studentId: { 
        type: String, 
        required: true 
    },
    studentName: { 
        type: String, 
        required: true 
    },
    attentionRecords: [attentionRecordSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    cameraStatus: {
        type: String,
        enum: ['active', 'inactive', 'not_detected'],
        default: 'inactive'
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    totalAttentiveTime: {
        type: Number,
        default: 0
    },
    totalSessionTime: {
        type: Number,
        default: 0
    },
    attentionPercentage: {
        type: Number,
        default: 0
    }
});

// Add method to calculate attention percentage
studentSessionSchema.methods.calculateAttentionPercentage = function() {
    if (this.totalSessionTime === 0) return 0;
    return (this.totalAttentiveTime / this.totalSessionTime) * 100;
};

const graphMetricSchema = new mongoose.Schema({
    timestamp: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    attentiveCount: { 
        type: Number, 
        required: true,
        default: 0 
    },
    inattentiveCount: { 
        type: Number, 
        required: true,
        default: 0 
    },
    cameraOffCount: { 
        type: Number, 
        required: true,
        default: 0 
    },
    notDetectedCount: { 
        type: Number, 
        required: true,
        default: 0 
    }
});

const sessionSchema = new mongoose.Schema({
    teacherId: { 
        type: String, 
        required: true,
        index: true 
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    students: [studentSessionSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    graphMetrics: [graphMetricSchema]
}, { 
    timestamps: true  // Adds createdAt and updatedAt fields
});

// Add index for active sessions
sessionSchema.index({ isActive: 1 });

// Add method to get session duration
sessionSchema.methods.getDuration = function() {
    const end = this.endTime || new Date();
    return end - this.startTime;
};

// Add method to get average attention percentage
sessionSchema.methods.getAverageAttentionPercentage = function() {
    if (this.students.length === 0) return 0;
    const total = this.students.reduce((sum, student) => 
        sum + student.attentionPercentage, 0);
    return total / this.students.length;
};

module.exports = mongoose.model('Session', sessionSchema); 