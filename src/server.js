import './config/env.js';
import express from 'express';
import app from './app.js';
import cloudinary from './config/cloudinary.js';
import connectDB from './config/database.js';

// Database connection
await connectDB();

// Cloudinary connection check
const checkCloudinaryConnection = () => {
  try {
    if (cloudinary.config().cloud_name) {
      console.log(`✅ Cloudinary connected successfully`);
      console.log(`   Cloud Name: ${cloudinary.config().cloud_name}`);
    } else {
      console.warn(`⚠️ Cloudinary configuration incomplete`);
    }
  } catch (error) {
    console.error(`❌ Cloudinary connection failed: ${error.message}`);
  }
};

checkCloudinaryConnection();

const PORT = process.env.PORT || 5000;

// IMPORTANT: Webhook needs raw body BEFORE JSON middleware
// We'll handle webhook route separately in app.js

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`\n📋 All systems ready!`);
  console.log(`   - Database: ${process.env.MONGODB_URI ? 'Configured ✅' : 'Missing ⚠️'}`);
  console.log(`   - Cloudinary: ${cloudinary.config().cloud_name ? 'Connected ✅' : 'Not configured ⚠️'}`);
  console.log(`   - JWT: ${process.env.JWT_SECRET ? 'Configured ✅' : 'Missing ⚠️'}`);
  console.log(`   - Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured ✅' : 'Missing ⚠️'}`);
  console.log(`\n✨ Ready to accept requests\n`);
}); 

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});