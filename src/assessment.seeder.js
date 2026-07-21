import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import Assessment model after env is loaded
import Assessment from './modules/assessment/assessment.model.js';

// Scale options from frontend
const scaleOptions = [
  { label: 'Strongly agree', value: 5 },
  { label: 'Agree', value: 4 },
  { label: 'Neutral', value: 3 },
  { label: 'Disagree', value: 2 },
  { label: 'Strongly disagree', value: 1 },
];

// ============================================================
// Helper to create questions with permanent nanoid IDs
// ============================================================
const createQuestions = (items) => {
  return items.map((text) => ({
    id: `question_${nanoid(10)}`,
    text,
    required: true,
    options: scaleOptions.map((opt) => ({
      id: `option_${nanoid(8)}`,
      label: opt.label,
      value: opt.value,
      score: opt.value,
    })),
  }));
};

// ============================================================
// Transform domains with permanent IDs
// ============================================================
const transformDomains = (sourceDomains) => {
  return sourceDomains.map((domain) => ({
    id: `domain_${nanoid(10)}`,
    key: domain.key,
    label: domain.label,
    description: domain.description,
    color: domain.color,
    reflection: {
      question: domain.open,
    },
    questions: createQuestions(domain.items),
  }));
};

// ============================================================
// Assessment data - matches frontend exactly with permanent IDs
// ============================================================
const assessments = {
  "pre-retiree": {
    slug: "pre-retiree",
    hero: {
      title: "Are You Ready for What Retirement Really Requires?",
      subtitle: "Planning to retire in 3–5 years",
      description: "Retirement is more than a financial transition. This assessment helps you understand your emotional, psychological, and lifestyle readiness before entering your next chapter.",
    },
    introduction: {
      badge: "Pre-Retiree",
      title: "Are You Ready for What Retirement Really Requires?",
      subtitle: "Planning to retire in 3–5 years",
      description: "Retirement is more than a financial transition. This assessment helps you understand your emotional, psychological, and lifestyle readiness before entering your next chapter.",
      duration: "10–12 min",
      ctaButton: "Begin Assessment",
    },
    domains: transformDomains([
      {
        key: "identity",
        label: "Identity & Purpose",
        color: "#534AB7",
        description: "How clearly you are developing a sense of identity beyond your professional role.",
        items: [
          "I have started thinking seriously about who I am outside of work.",
          "I have identified activities that could give me meaning after retirement.",
          "I can imagine a fulfilling lifestyle beyond my current career.",
        ],
        open: "What part of your identity do you think will change most after retirement?",
      },
      {
        key: "engagement",
        label: "Engagement & Vitality",
        color: "#1D9E75",
        description: "Your readiness to maintain structure, energy, and healthy routines in retirement.",
        items: [
          "I regularly participate in activities outside of work that energize me.",
          "I maintain habits that support my long-term physical health.",
          "I have thought about how I will stay mentally active after retirement.",
        ],
        open: "How do you plan to stay engaged and energized once work is no longer central to your life?",
      },
      {
        key: "connection",
        label: "Connection & Belonging",
        color: "#BA7517",
        description: "The strength of your relationships and support systems outside of work.",
        items: [
          "I have meaningful relationships outside of my workplace.",
          "I feel confident I will maintain strong social connections after retirement.",
          "I actively invest time in family, friendships, or community.",
        ],
        open: "How do you plan to maintain community and connection after retirement?",
      },
      {
        key: "growth",
        label: "Growth & Learning",
        color: "#185FA5",
        description: "Your commitment to continued learning and personal growth.",
        items: [
          "I am interested in learning new things during retirement.",
          "I regularly challenge myself intellectually.",
          "I see retirement as an opportunity for continued growth.",
        ],
        open: "What areas of growth or learning are you excited to explore in retirement?",
      },
      {
        key: "meaning",
        label: "Meaning & Legacy",
        color: "#993556",
        description: "Your sense of contribution, purpose, and legacy in the years ahead.",
        items: [
          "I have thought about the legacy I want to leave.",
          "I want my retirement years to contribute to something meaningful.",
          "My purpose feels connected to values beyond my career.",
        ],
        open: "What do you want the next chapter of your life to stand for?",
      },
    ]),
    results: {
      ranges: [
        {
          id: `range_${nanoid(8)}`,
          title: "Ready for Retirement",
          minScore: 80,
          maxScore: 100,
          description: "You are well prepared for retirement with strong foundations.",
          color: "#10b981",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Getting Closer",
          minScore: 60,
          maxScore: 79,
          description: "You are making progress but have areas to strengthen.",
          color: "#C9A84C",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Needs Attention",
          minScore: 0,
          maxScore: 59,
          description: "There are areas that need attention and development.",
          color: "#ef4444",
          recommendations: [],
        },
      ],
    },
    status: "published",
  },

  "recent-retiree": {
    slug: "recent-retiree",
    hero: {
      title: "How Well Are You Navigating the New Terrain of Retirement?",
      subtitle: "Retired in the past 5 years",
      description: "The early years of retirement are one of the most important psychological transitions of adult life. This assessment helps you understand how well you are adapting emotionally, socially, and personally.",
    },
    introduction: {
      badge: "Recent Retiree",
      title: "How Well Are You Navigating the New Terrain of Retirement?",
      subtitle: "Retired in the past 5 years",
      description: "The early years of retirement are one of the most important psychological transitions of adult life. This assessment helps you understand how well you are adapting emotionally, socially, and personally.",
      duration: "10–12 min",
      ctaButton: "Begin Assessment",
    },
    domains: transformDomains([
      {
        key: "identity",
        label: "Identity & Purpose",
        color: "#534AB7",
        description: "How clearly you have developed a sense of self beyond your former career.",
        items: [
          "I have developed a clear identity outside of my former professional role.",
          "I feel a sense of purpose in my retirement life.",
          "I have meaningful activities that reflect my values.",
        ],
        open: "How has your identity changed since retirement?",
      },
      {
        key: "engagement",
        label: "Engagement & Vitality",
        color: "#1D9E75",
        description: "How successfully you have replaced the structure and stimulation of work.",
        items: [
          "My retirement life includes activities that energize me.",
          "I maintain routines that support my health and wellbeing.",
          "I regularly experience enjoyment and mental stimulation.",
        ],
        open: "What has been the hardest part of replacing the structure of work?",
      },
      {
        key: "connection",
        label: "Connection & Belonging",
        color: "#BA7517",
        description: "The quality of your relationships and social support in retirement.",
        items: [
          "I have strong emotional support from others.",
          "I feel connected to community outside of work.",
          "I am satisfied with my current social relationships.",
        ],
        open: "How have your relationships changed since retirement?",
      },
      {
        key: "growth",
        label: "Growth & Learning",
        color: "#185FA5",
        description: "Your commitment to staying curious, active, and engaged in learning.",
        items: [
          "I continue learning new things in retirement.",
          "I seek intellectual stimulation regularly.",
          "I see retirement as an opportunity for growth.",
        ],
        open: "What are you currently learning or developing?",
      },
      {
        key: "meaning",
        label: "Meaning & Legacy",
        color: "#993556",
        description: "Your sense of contribution and meaning in this new chapter.",
        items: [
          "I feel my life still contributes to something meaningful.",
          "My daily activities align with my values.",
          "I feel at peace with the contributions I have made.",
        ],
        open: "What do you want this chapter of your life to represent?",
      },
    ]),
    results: {
      ranges: [
        {
          id: `range_${nanoid(8)}`,
          title: "Thriving in Transition",
          minScore: 80,
          maxScore: 100,
          description: "You are adapting well to retirement life.",
          color: "#10b981",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Finding Your Way",
          minScore: 60,
          maxScore: 79,
          description: "You are making progress in your retirement transition.",
          color: "#C9A84C",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Needs Attention",
          minScore: 0,
          maxScore: 59,
          description: "There are areas that need attention in your retirement transition.",
          color: "#ef4444",
          recommendations: [],
        },
      ],
    },
    status: "published",
  },

  "established-retiree": {
    slug: "established-retiree",
    hero: {
      title: "Are You Thriving in Retirement — or Simply Existing?",
      subtitle: "Retired 5 or more years",
      description: "Retirement evolves over time. This assessment explores whether your retirement years continue to provide meaning, engagement, connection, and growth.",
    },
    introduction: {
      badge: "Established Retiree",
      title: "Are You Thriving in Retirement — or Simply Existing?",
      subtitle: "Retired 5 or more years",
      description: "Retirement evolves over time. This assessment explores whether your retirement years continue to provide meaning, engagement, connection, and growth.",
      duration: "10–12 min",
      ctaButton: "Begin Assessment",
    },
    domains: transformDomains([
      {
        key: "identity",
        label: "Identity & Purpose",
        color: "#534AB7",
        description: "Your ongoing sense of purpose and identity in long-term retirement.",
        items: [
          "I feel clear about who I am in this stage of life.",
          "I continue to experience meaning in my daily life.",
          "My life feels aligned with my personal values.",
        ],
        open: "What currently gives your life the strongest sense of purpose?",
      },
      {
        key: "engagement",
        label: "Engagement & Vitality",
        color: "#1D9E75",
        description: "Your level of energy, activity, and lifestyle engagement.",
        items: [
          "I stay physically active and engaged.",
          "My days feel meaningful and structured.",
          "I regularly participate in enjoyable activities.",
        ],
        open: "What helps you maintain vitality and energy in retirement?",
      },
      {
        key: "connection",
        label: "Connection & Belonging",
        color: "#BA7517",
        description: "The strength and quality of your relationships and community.",
        items: [
          "I feel socially connected and supported.",
          "I actively nurture meaningful relationships.",
          "I feel a sense of belonging in my community.",
        ],
        open: "How do you maintain strong relationships and connection?",
      },
      {
        key: "growth",
        label: "Growth & Learning",
        color: "#185FA5",
        description: "Your continued curiosity, learning, and personal development.",
        items: [
          "I continue exploring new interests or skills.",
          "I enjoy learning and staying mentally active.",
          "I believe growth is important at every stage of life.",
        ],
        open: "What new experiences or learning opportunities excite you now?",
      },
      {
        key: "meaning",
        label: "Meaning & Legacy",
        color: "#993556",
        description: "Your reflection on contribution, fulfillment, and legacy.",
        items: [
          "I feel fulfilled by the life I am living today.",
          "I believe I am contributing positively to others.",
          "I feel my retirement years have meaning and significance.",
        ],
        open: "What kind of legacy do you hope to continue building?",
      },
    ]),
    results: {
      ranges: [
        {
          id: `range_${nanoid(8)}`,
          title: "Thriving in Retirement",
          minScore: 80,
          maxScore: 100,
          description: "You are thriving in your established retirement years.",
          color: "#10b981",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Finding Fulfillment",
          minScore: 60,
          maxScore: 79,
          description: "You are finding fulfillment but have areas to strengthen.",
          color: "#C9A84C",
          recommendations: [],
        },
        {
          id: `range_${nanoid(8)}`,
          title: "Needs Attention",
          minScore: 0,
          maxScore: 59,
          description: "There are areas that need attention in your retirement.",
          color: "#ef4444",
          recommendations: [],
        },
      ],
    },
    status: "published",
  },
};

// ============================================================
// Seed assessments into the database
// ============================================================
export async function seedAssessments() {
  console.log('🌱 Starting assessment seeder...');

  try {
    // Check if assessments already exist
    const count = await Assessment.countDocuments({ deletedAt: null });
    
    if (count > 0) {
      console.log(`📊 ${count} assessments already exist. Skipping seed.`);
      return { skipped: true, count };
    }

    // Insert all assessments
    const assessmentArray = Object.values(assessments);
    const inserted = await Assessment.insertMany(assessmentArray);
    
    console.log(`✅ Successfully seeded ${inserted.length} assessments:`);
    inserted.forEach(assessment => {
      const domainCount = assessment.domains?.length || 0;
      const questionCount = assessment.domains?.reduce((total, d) => total + (d.questions?.length || 0), 0) || 0;
      console.log(`  ✔ ${assessment.slug} (${assessment.status}) - ${domainCount} domains, ${questionCount} questions`);
    });

    return { inserted: inserted.length };
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// ============================================================
// Clear all assessments (use with caution)
// ============================================================
export async function clearAssessments() {
  console.log('🗑️ Clearing all assessments...');
  const result = await Assessment.deleteMany({});
  console.log(`✅ Cleared ${result.deletedCount} assessments`);
  return result;
}

// ============================================================
// Connect to MongoDB using the existing configuration
// ============================================================
async function connectToDatabase() {
  console.log('🌱 Connecting to MongoDB...');
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Check if already connected
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

// ============================================================
// Disconnect from MongoDB
// ============================================================
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

// ============================================================
// Main execution
// ============================================================
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  console.log('🚀 Running assessment seeder...');
  
  (async () => {
    try {
      // Connect to MongoDB
      await connectToDatabase();

      // Run the seeder
      const result = await seedAssessments();

      // Print summary
      if (result?.skipped) {
        console.log(`✅ Seeder completed successfully. ${result.count} assessments already exist.`);
      } else {
        console.log(`✅ Seeder completed successfully. ${result?.inserted || 0} assessments seeded.`);
      }

      // Disconnect
      await disconnectFromDatabase();

      process.exit(0);
    } catch (error) {
      console.error('❌ Seeder failed with error:', error.message);
      
      // Attempt to disconnect safely
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
  seedAssessments,
  clearAssessments,
};