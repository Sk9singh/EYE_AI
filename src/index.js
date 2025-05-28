const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Dashboard = require('./models/Dashboard');
const StudentController = require('./controllers/StudentController');
const createStudentRoutes = require('./routes/studentRoutes');
const SessionController = require('./controllers/SessionController');
const sessionRoutes = require('./routes/sessionRoutes');
const FileController = require('./controllers/FileController');
const createFileRoutes = require('./routes/fileRoutes');
const SocketService = require('./services/SocketService');

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eyeai', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Initialize models and controllers
const dashboard = new Dashboard();
const studentController = new StudentController(dashboard);

// Initialize WebSocket service
const socketService = new SocketService(io);

// Initialize controllers with SocketService
const sessionController = new SessionController(socketService);
const fileController = new FileController(socketService);

// Setup routes
app.use('/student', createStudentRoutes(studentController));
app.use('/api', sessionRoutes(sessionController));
app.use('/api/files', createFileRoutes(fileController));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// WebSocket connection logging
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server is ready`);
});
