import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test connection function
export const testCloudinaryConnection = async () => {
  try {
    // Simple API call to check connection
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      console.log('✅ Cloudinary API connection successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Get cloudinary config info (without exposing secrets)
export const getCloudinaryInfo = () => {
  return {
    cloud_name: cloudinary.config().cloud_name,
    isConfigured: !!(cloudinary.config().cloud_name && 
                     cloudinary.config().api_key && 
                     cloudinary.config().api_secret),
    api_key_prefix: cloudinary.config().api_key ? 
                     cloudinary.config().api_key.substring(0, 6) + '...' : 
                     'not set'
  };
};

// Upload with progress tracking
export const uploadWithProgress = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'retirement-waypoint',
        resource_type: options.resource_type || 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const Readable = require('stream').Readable;
    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
};

export default cloudinary;