import mongoose from 'mongoose';

const homeCmsSchema = new mongoose.Schema(
  {
    hero: {
      badge: {
        type: String,
        default: 'Retirement made clearer',
        trim: true,
      },
      title: {
        type: String,
        default: 'Navigate Retirement With Confidence, Purpose, and Clarity',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Retirement Waypoint helps professionals understand their readiness, rediscover purpose, and build a meaningful next chapter through guided assessments and expert insights.',
        trim: true,
      },
      ctaText: {
        type: String,
        default: 'Take Assessment',
        trim: true,
      },
      ctaLink: {
        type: String,
        default: '/assessment',
        trim: true,
      },
      backgroundImage: {
        type: String,
        default: '/images/hero-bg.png',
        trim: true,
      },
      trustPoints: [
        {
          iconName: { type: String, default: 'TrendingUp' },
          text: { type: String, default: '' },
        },
      ],
    },
    trust: {
      badge: {
        type: String,
        default: 'Built for meaningful transition',
        trim: true,
      },
      title: {
        type: String,
        default: 'Built on Psychology, Purpose, and Progress',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Helping professionals transition into retirement with clarity, confidence, and a practical framework for building a meaningful next chapter.',
        trim: true,
      },
      stats: [
        {
          iconName: { type: String, default: 'Briefcase' },
          value: { type: String, default: '' },
          label: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
    },
    assessmentPreview: {
      badge: {
        type: String,
        default: 'Retirement Readiness Assessment',
        trim: true,
      },
      title: {
        type: String,
        default: 'Understand Where You Are — And What Comes Next',
        trim: true,
      },
      description: {
        type: String,
        default:
          'Gain personalized insights into your emotional readiness, lifestyle structure, purpose, and confidence as you prepare for retirement.',
        trim: true,
      },
      steps: [
        {
          iconName: { type: String, default: 'Target' },
          title: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
      sampleCard: {
        questionNumber: {
          type: String,
          default: 'Question 13',
          trim: true,
        },
        progressPercent: {
          type: String,
          default: '52%',
          trim: true,
        },
        questionText: {
          type: String,
          default: 'My life purpose feels connected to values beyond my career.',
          trim: true,
        },
        options: {
          type: [String],
          default: [
            'Strongly Agree',
            'Agree',
            'Neutral',
            'Disagree',
            'Strongly Disagree',
          ],
        },
        selectedOptionIndex: {
          type: Number,
          default: 1,
        },
        footerText: {
          type: String,
          default: 'Powered by behavioral psychology',
          trim: true,
        },
      },
    },
    support: {
      backgroundImage: {
        type: String,
        default: '/images/support-bg.jpg',
        trim: true,
      },
      badge: {
        type: String,
        default: 'How Retirement Waypoint Helps',
        trim: true,
      },
      title: {
        type: String,
        default: 'Support For Your Next Chapter',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'A simple, structured way to understand your readiness, build purpose, and move into retirement with confidence.',
        trim: true,
      },
      items: [
        {
          iconName: { type: String, default: 'ClipboardCheck' },
          title: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
    },
    newsletter: {
      backgroundImage: {
        type: String,
        default: '/images/newsletter-bg.jpg',
        trim: true,
      },
      title: {
        type: String,
        default: 'Stay Up to Date With Our Newsletter',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Our retirement transition insights are designed to guide you through every step of the process.',
        trim: true,
      },
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Initial default data
const defaultHomeCmsData = {
  hero: {
    badge: 'Retirement made clearer',
    title: 'Navigate Retirement With Confidence, Purpose, and Clarity',
    subtitle:
      'Retirement Waypoint helps professionals understand their readiness, rediscover purpose, and build a meaningful next chapter through guided assessments and expert insights.',
    ctaText: 'Take Assessment',
    ctaLink: '/assessment',
    backgroundImage: '/images/hero-bg.png',
    trustPoints: [
      { iconName: 'TrendingUp', text: 'Psychology-based guidance' },
      { iconName: 'Users', text: 'Personalized readiness insights' },
      { iconName: 'Target', text: 'Progress tracking for your next chapter' },
    ],
  },
  trust: {
    badge: 'Built for meaningful transition',
    title: 'Built on Psychology, Purpose, and Progress',
    subtitle:
      'Helping professionals transition into retirement with clarity, confidence, and a practical framework for building a meaningful next chapter.',
    stats: [
      {
        iconName: 'Briefcase',
        value: '40+',
        label: 'Years Experience',
        description:
          'Behavioral psychology experience focused on people, purpose, and life transitions.',
      },
      {
        iconName: 'ClipboardCheck',
        value: 'Guided',
        label: 'Assessments',
        description:
          'Structured readiness tools designed to reveal emotional and lifestyle preparation.',
      },
      {
        iconName: 'TrendingUp',
        value: 'Progress',
        label: 'Tracking',
        description:
          'Help users understand where they are today and what to improve next.',
      },
      {
        iconName: 'Lightbulb',
        value: 'Expert',
        label: 'Insights',
        description:
          'Research-backed guidance around identity, structure, relationships, and purpose.',
      },
    ],
  },
  assessmentPreview: {
    badge: 'Retirement Readiness Assessment',
    title: 'Understand Where You Are — And What Comes Next',
    description:
      'Gain personalized insights into your emotional readiness, lifestyle structure, purpose, and confidence as you prepare for retirement.',
    steps: [
      {
        iconName: 'Target',
        title: 'Answer Guided Questions',
        description:
          'Reflect on your retirement readiness across key life areas',
      },
      {
        iconName: 'BarChart3',
        title: 'Receive Personalized Insights',
        description:
          'Get data-driven feedback tailored to your unique situation',
      },
      {
        iconName: 'TrendingUp',
        title: 'Track Your Progress',
        description:
          'Monitor your growth and adjust your retirement roadmap',
      },
    ],
    sampleCard: {
      questionNumber: 'Question 13',
      progressPercent: '52%',
      questionText:
        'My life purpose feels connected to values beyond my career.',
      options: [
        'Strongly Agree',
        'Agree',
        'Neutral',
        'Disagree',
        'Strongly Disagree',
      ],
      selectedOptionIndex: 1,
      footerText: 'Powered by behavioral psychology',
    },
  },
  support: {
    backgroundImage: '/images/support-bg.jpg',
    badge: 'How Retirement Waypoint Helps',
    title: 'Support For Your Next Chapter',
    subtitle:
      'A simple, structured way to understand your readiness, build purpose, and move into retirement with confidence.',
    items: [
      {
        iconName: 'ClipboardCheck',
        title: 'Readiness Assessment',
        description:
          'Understand your emotional, lifestyle, and purpose readiness before retirement.',
      },
      {
        iconName: 'LineChart',
        title: 'Progress Tracking',
        description:
          'Track your growth over time and see where your next chapter is improving.',
      },
      {
        iconName: 'Compass',
        title: 'Purpose & Identity',
        description:
          'Navigate the shift from career identity to a more meaningful life structure.',
      },
      {
        iconName: 'BookOpen',
        title: 'Guided Resources',
        description:
          'Access practical books, worksheets, and insights designed for transition.',
      },
      {
        iconName: 'HeartHandshake',
        title: 'Coaching Support',
        description:
          'Receive personal guidance for building confidence, clarity, and direction.',
      },
      {
        iconName: 'Lightbulb',
        title: 'Expert Insights',
        description:
          'Learn from behavioral psychology principles and real retirement experience.',
      },
    ],
  },
  newsletter: {
    backgroundImage: '/images/newsletter-bg.jpg',
    title: 'Stay Up to Date With Our Newsletter',
    subtitle:
      'Our retirement transition insights are designed to guide you through every step of the process.',
  },
};

// Singleton getter
homeCmsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(defaultHomeCmsData);
  }
  return doc;
};

homeCmsSchema.index({ createdAt: 1 });

export const HomeCms = mongoose.model('HomeCms', homeCmsSchema);
