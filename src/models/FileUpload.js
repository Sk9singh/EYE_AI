const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadTime: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    }
});

// Add indexes for faster queries
fileUploadSchema.index({ teacherId: 1, sessionId: 1 });
fileUploadSchema.index({ studentId: 1, sessionId: 1 });

module.exports = mongoose.model('FileUpload', fileUploadSchema); 