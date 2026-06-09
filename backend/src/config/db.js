const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This tells Mongoose to look at your .env file for the connection string
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If the database fails, we kill the server so we know there's a problem
    process.exit(1); 
  }
};

module.exports = connectDB;