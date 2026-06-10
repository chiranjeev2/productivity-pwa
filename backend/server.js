require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db'); // Check if your db is in src/config/
const authRoutes = require('./src/routes/authRoutes'); // Check if auth is in src/routes/
const goalRoutes = require('./src/routes/goalRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

// Import the HTTP and Socket.io modules
const http = require('http');
const { Server } = require('socket.io');

const app = express();

app.use(cors()); 
app.use(express.json());

connectDB();

// 🔴 FIXED: Removed the duplicate taskRoutes initialization
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/goals', goalRoutes);

// Upgrade the Express app to a WebSocket-enabled server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make 'io' globally accessible so our routes can broadcast messages
app.set('io', io);

// Listen for WebSocket connections
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket Connected: ${socket.id}`);

  // When a user logs in, they join a private "room" with their User ID
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`🔒 User joined private room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`💤 WebSocket Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
// CRITICAL: We now listen on 'server', not 'app'
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));