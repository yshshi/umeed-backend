const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'YOUR_MONGODB_CONNECTION_STRING' || uri.includes('your_mongodb')) {
    console.error('');
    console.error('MongoDB connection string is missing or still the placeholder.');
    console.error('Please create/edit backend/.env and set MONGODB_URI to your real connection string.');
    console.error('Example: MONGODB_URI=mongodb://localhost:27017/umeed');
    console.error('Or use MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/umeed');
    console.error('');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('Tip: Check if MongoDB is running, or if the hostname in MONGODB_URI is correct.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
