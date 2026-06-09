// backend/src/sockets/syncHandler.js
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Device connected: ${socket.id} for user ${socket.user.id}`);
    
    // Join a room specific to this user
    socket.join(socket.user.id.toString());

    socket.on('disconnect', () => {
      console.log(`🔴 Device disconnected: ${socket.id}`);
    });
  });
};