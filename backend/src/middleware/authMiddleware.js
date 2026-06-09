const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if the React frontend sent an Authorization header with a Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token string
      token = req.headers.authorization.split(' ')[1];

      // Decrypt the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database, but DO NOT return their password
      req.user = await User.findById(decoded.id).select('-password');
      
      // Move on to the next step (e.g., creating the task)
      next();
    } catch (error) {
      console.error("❌ Token Verification Failed:", error.message);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };