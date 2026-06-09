const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper function to create a secure login ticket (JWT)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// POST: Register a new user
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // SANITY CHECK: Let's see what React actually sent us
    console.log("📥 Received from React:", { name, email, password: "***" });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("⚠️ Registration failed: Email already in use");
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create the user in MongoDB
    const user = await User.create({ name, email, password });

    if (user) {
      console.log("✅ New user successfully created in MongoDB!");
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    // THE UNMASKING: Print the exact reason it crashed to the terminal
    console.error("🔥 ACTUAL BACKEND ERROR ON REGISTER:", error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});


// ==========================================
// POST: Login an existing user
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`📥 Login attempt for email: ${email}`);

    const user = await User.findOne({ email });

    // Check if user exists AND password is correct
    if (user && (await user.matchPassword(password))) {
      console.log("✅ User logged in successfully!");
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      console.log("⚠️ Login failed: Invalid credentials");
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("🔥 ACTUAL BACKEND ERROR ON LOGIN:", error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;