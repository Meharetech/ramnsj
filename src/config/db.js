const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/orbitfx',
        { serverSelectionTimeoutMS: 5000 }
      );
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      attempt++;
      console.error(`❌ MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('💥 All MongoDB connection attempts failed. Server will continue without DB.');
        // Do NOT call process.exit(1) — keep the server alive so we can diagnose
      }
    }
  }
};

module.exports = connectDB;
