const FileUpload = require('../models/FileUpload');
const path = require('path');
const fs = require('fs').promises;

class FileController {
    constructor(socketService) {
        this.socketService = socketService;
        this.uploadDir = path.join(__dirname, '../../uploads');
        this.initializeUploadDir();
    }

    async initializeUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('Error creating upload directory:', error);
        }
    }

    async uploadFile(teacherId, sessionId, studentId, studentName, file, description) {
        try {
            // Create unique filename
            const timestamp = Date.now();
            const originalName = file.originalname;
            const fileExt = path.extname(originalName);
            const fileName = `${studentId}_${timestamp}${fileExt}`;
            const filePath = path.join(this.uploadDir, fileName);

            // Save file to disk
            await fs.writeFile(filePath, file.buffer);

            // Create database record
            const fileUpload = new FileUpload({
                studentId,
                studentName,
                teacherId,
                sessionId,
                fileName: originalName,
                filePath,
                fileType: file.mimetype,
                fileSize: file.size,
                description
            });

            await fileUpload.save();

            // Notify teacher about new file
            this.socketService.emitFileUploaded(teacherId, {
                studentId,
                studentName,
                fileName: originalName,
                uploadTime: fileUpload.uploadTime,
                description
            });

            return fileUpload;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        }
    }

    async getSessionFiles(teacherId, sessionId) {
        try {
            return await FileUpload.find({ teacherId, sessionId })
                .sort({ uploadTime: -1 });
        } catch (error) {
            console.error('Error getting session files:', error);
            throw new Error('Failed to get session files');
        }
    }

    async getStudentFiles(teacherId, sessionId, studentId) {
        try {
            return await FileUpload.find({ teacherId, sessionId, studentId })
                .sort({ uploadTime: -1 });
        } catch (error) {
            console.error('Error getting student files:', error);
            throw new Error('Failed to get student files');
        }
    }

    async downloadFile(fileId) {
        try {
            const fileUpload = await FileUpload.findById(fileId);
            if (!fileUpload) {
                throw new Error('File not found');
            }

            const fileData = await fs.readFile(fileUpload.filePath);
            return {
                fileData,
                fileName: fileUpload.fileName,
                fileType: fileUpload.fileType
            };
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error('Failed to download file');
        }
    }

    async deleteFile(fileId) {
        try {
            const fileUpload = await FileUpload.findById(fileId);
            if (!fileUpload) {
                throw new Error('File not found');
            }

            // Delete file from disk
            await fs.unlink(fileUpload.filePath);

            // Delete database record
            await FileUpload.findByIdAndDelete(fileId);

            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }
}

module.exports = FileController; 