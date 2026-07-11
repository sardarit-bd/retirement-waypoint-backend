import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { AssessmentLanding } from './modules/assessment-landing/assessment-landing.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const initialLanding = {
  badge: 'Retirement Waypoint',
  title: 'Choose Your Assessment',
  subtitle: 'Select the assessment that best matches your current retirement stage.',
  description: 'Each assessment draws on psychological research and includes reflection questions that will be analyzed alongside the assessment items to provide a complete and transparent measure of your current retirement readiness and overall status.',
};

/**
 * Seed landing configuration
 */
export async function seedLanding() {
  console.log('🌱 Starting landing seeder...');

  try {
    const exists = await AssessmentLanding.countDocuments();
    if (exists > 0) {
      console.log(`📊 Landing configuration already exists. Skipping seed.`);
      return { skipped: true };
    }

    const landing = await AssessmentLanding.create(initialLanding);
    console.log(`✅ Successfully seeded landing configuration:`);
    console.log(`  ✔ Badge: ${landing.badge}`);
    console.log(`  ✔ Title: ${landing.title}`);
    console.log(`  ✔ Subtitle: ${landing.subtitle}`);
    console.log(`  ✔ Description: ${landing.description.substring(0, 50)}...`);

    return { inserted: 1 };
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

/**
 * Clear landing configuration (use with caution)
 */
export async function clearLanding() {
  console.log('🗑️ Clearing landing configuration...');
  const result = await AssessmentLanding.deleteMany({});
  console.log(`✅ Cleared ${result.deletedCount} landing configuration`);
  return result;
}

async function connectToDatabase() {
  console.log('🌱 Connecting to MongoDB...');
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (mongoose.connection.readyState === 1) {
    console.log('✅ Already connected to MongoDB');
    return mongoose.connection;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

async function disconnectFromDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  } catch (error) {
    console.warn('⚠️ Error during disconnection:', error.message);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  console.log('🚀 Running landing seeder...');
  
  (async () => {
    try {
      await connectToDatabase();
      const result = await seedLanding();
      
      if (result?.skipped) {
        console.log(`✅ Seeder completed successfully. Landing already exists.`);
      } else {
        console.log(`✅ Seeder completed successfully. Landing configuration seeded.`);
      }

      await disconnectFromDatabase();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeder failed with error:', error.message);
      try {
        await disconnectFromDatabase();
      } catch (disconnectError) {
        console.warn('⚠️ Error during disconnection:', disconnectError.message);
      }
      process.exit(1);
    }
  })();
}

export default {
  seedLanding,
  clearLanding,
};