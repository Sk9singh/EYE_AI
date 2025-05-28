const express = require('express');
const multer = require('multer');
const router = express.Router();

function createFileRoutes(fileController) {
    // Configure multer for file uploads
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });

    // Upload file
    router.post('/upload', upload.single('file'), async (req, res) => {
        try {
            const { teacherId, sessionId, studentId, studentName, description } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await fileController.uploadFile(
                teacherId,
                sessionId,
                studentId,
                studentName,
                file,
                description
            );

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get session files
    router.get('/session/:teacherId/:sessionId', async (req, res) => {
        try {
            const { teacherId, sessionId } = req.params;
            const files = await fileController.getSessionFiles(teacherId, sessionId);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get student files
    router.get('/student/:teacherId/:sessionId/:studentId', async (req, res) => {
        try {
            const { teacherId, sessionId, studentId } = req.params;
            const files = await fileController.getStudentFiles(teacherId, sessionId, studentId);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Download file
    router.get('/download/:fileId', async (req, res) => {
        try {
            const { fileId } = req.params;
            const { fileData, fileName, fileType } = await fileController.downloadFile(fileId);

            res.setHeader('Content-Type', fileType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(fileData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete file
    router.delete('/:fileId', async (req, res) => {
        try {
            const { fileId } = req.params;
            await fileController.deleteFile(fileId);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = createFileRoutes; 