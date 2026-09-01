import mongoose from 'mongoose';

const domainItemSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      default: 'FIVE DOMAINS',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    iconName: {
      type: String,
      default: 'Compass',
      trim: true,
    },
  },
  { _id: false }
);

const coachingCmsSchema = new mongoose.Schema(
  {
    hero: {
      badge: {
        type: String,
        default: 'Retirement Coaching',
        trim: true,
      },
      title: {
        type: String,
        default: 'Retirement Coaching with David Allen, Ph.D.',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Personalized guidance to help you navigate retirement with purpose, structure, confidence, and emotional readiness.',
        trim: true,
      },
    },

    overview: {
      badge: {
        type: String,
        default: 'Coaching Services',
        trim: true,
      },
      headline: {
        type: String,
        default:
          'Most people prepare financially for retirement — but not for everything else.',
        trim: true,
      },
      paragraphs: {
        type: [String],
        default: [
          'The loss of structure. The shift in identity. The question of what comes next. These aren’t small adjustments. They’re among the most significant psychological transitions you’ll ever navigate in your lifetime.',
          'I’m a behavioral and industrial psychologist with 40 years of experience helping people understand what drives them — and what holds them back. I’ve spent the last chapter of my own career doing what I wish more people had helped me do earlier: applying behavioral science to the question of how to actually thrive in retirement, not just survive it.',
          'My coaching draws on around the five domains of retirement thriving - (1) Identify the purpose, (2) Engagement and vitality, (3) Connection and belonging, (4) Growth and learning, and (5) Meaning and legacy. These domains consistently link to wellbeing and fulfillment in later life. We don’t just talk. We build a clear picture of where you are, where you want to go, and what’s standing in the way.',
        ],
      },
    },

    framework: {
      badge: {
        type: String,
        default: 'THE FRAMEWORK',
        trim: true,
      },
      title: {
        type: String,
        default: 'Five Domains of Retirement Thriving',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Grounded in decades of behavioral science, these five domains provide a practical framework for building a meaningful and fulfilling retirement.',
        trim: true,
      },
      domains: {
        type: [domainItemSchema],
        default: [
          {
            tag: 'FIVE DOMAINS',
            title: 'Identity & Purpose',
            subtitle: 'Who are you becoming?',
            description:
              'Who are you when the title is gone? Reclaiming identity anchored in values, not roles.',
            iconName: 'Compass',
          },
          {
            tag: 'FIVE DOMAINS',
            title: 'Engagement & Vitality',
            subtitle: 'Energy and flow',
            description:
              'Energy, flow, and the daily rhythm of a life that feels alive and fully activated.',
            iconName: 'Zap',
          },
          {
            tag: 'FIVE DOMAINS',
            title: 'Connection & Belonging',
            subtitle: 'Relationships that sustain',
            description:
              'The quality and intentionality of relationships that sustain wellbeing across decades.',
            iconName: 'HeartHandshake',
          },
          {
            tag: 'FIVE DOMAINS',
            title: 'Growth & Learning',
            subtitle: 'Stay curious, stay vital',
            description:
              'Staying curious, challenged, and expanding — the antidote to stagnation in retirement.',
            iconName: 'GraduationCap',
          },
          {
            tag: 'FIVE DOMAINS',
            title: 'Meaning & Legacy',
            subtitle: 'What you leave behind',
            description:
              'What you stand for, what you leave behind, and the story you choose to live now.',
            iconName: 'Sparkles',
          },
        ],
      },
    },

    assessmentNote: {
      noteText: {
        type: String,
        default:
          'Your assessment results will be used as a starting point to develop a customized coaching plan for you. This data will be stored and tracked to measure progress during the coaching engagement. Comments will be combined with survey results to identify the key factors that can have the biggest impact on your ability to thrive in retirement.',
        trim: true,
      },
    },

    eligibility: {
      boxTitle: {
        type: String,
        default: 'This is right for you if:',
        trim: true,
      },
      points: {
        type: [String],
        default: [
          'You’re within 2–3 years of retiring and want to go in prepared',
          'You’ve already retired and feel like something’s missing',
          'You’re restless, disconnected, or struggling to find your footing',
        ],
      },
    },

    cta: {
      buttonText: {
        type: String,
        default: 'Work With Me',
        trim: true,
      },
      buttonLink: {
        type: String,
        default: '/contact',
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

export const defaultCoachingCmsData = {
  hero: {
    badge: 'Retirement Coaching',
    title: 'Retirement Coaching with David Allen, Ph.D.',
    subtitle:
      'Personalized guidance to help you navigate retirement with purpose, structure, confidence, and emotional readiness.',
  },
  overview: {
    badge: 'Coaching Services',
    headline:
      'Most people prepare financially for retirement — but not for everything else.',
    paragraphs: [
      'The loss of structure. The shift in identity. The question of what comes next. These aren’t small adjustments. They’re among the most significant psychological transitions you’ll ever navigate in your lifetime.',
      'I’m a behavioral and industrial psychologist with 40 years of experience helping people understand what drives them — and what holds them back. I’ve spent the last chapter of my own career doing what I wish more people had helped me do earlier: applying behavioral science to the question of how to actually thrive in retirement, not just survive it.',
      'My coaching draws on around the five domains of retirement thriving - (1) Identify the purpose, (2) Engagement and vitality, (3) Connection and belonging, (4) Growth and learning, and (5) Meaning and legacy. These domains consistently link to wellbeing and fulfillment in later life. We don’t just talk. We build a clear picture of where you are, where you want to go, and what’s standing in the way.',
    ],
  },
  framework: {
    badge: 'THE FRAMEWORK',
    title: 'Five Domains of Retirement Thriving',
    subtitle:
      'Grounded in decades of behavioral science, these five domains provide a practical framework for building a meaningful and fulfilling retirement.',
    domains: [
      {
        tag: 'FIVE DOMAINS',
        title: 'Identity & Purpose',
        subtitle: 'Who are you becoming?',
        description:
          'Who are you when the title is gone? Reclaiming identity anchored in values, not roles.',
        iconName: 'Compass',
      },
      {
        tag: 'FIVE DOMAINS',
        title: 'Engagement & Vitality',
        subtitle: 'Energy and flow',
        description:
          'Energy, flow, and the daily rhythm of a life that feels alive and fully activated.',
        iconName: 'Zap',
      },
      {
        tag: 'FIVE DOMAINS',
        title: 'Connection & Belonging',
        subtitle: 'Relationships that sustain',
        description:
          'The quality and intentionality of relationships that sustain wellbeing across decades.',
        iconName: 'HeartHandshake',
      },
      {
        tag: 'FIVE DOMAINS',
        title: 'Growth & Learning',
        subtitle: 'Stay curious, stay vital',
        description:
          'Staying curious, challenged, and expanding — the antidote to stagnation in retirement.',
        iconName: 'GraduationCap',
      },
      {
        tag: 'FIVE DOMAINS',
        title: 'Meaning & Legacy',
        subtitle: 'What you leave behind',
        description:
          'What you stand for, what you leave behind, and the story you choose to live now.',
        iconName: 'Sparkles',
      },
    ],
  },
  assessmentNote: {
    noteText:
      'Your assessment results will be used as a starting point to develop a customized coaching plan for you. This data will be stored and tracked to measure progress during the coaching engagement. Comments will be combined with survey results to identify the key factors that can have the biggest impact on your ability to thrive in retirement.',
  },
  eligibility: {
    boxTitle: 'This is right for you if:',
    points: [
      'You’re within 2–3 years of retiring and want to go in prepared',
      'You’ve already retired and feel like something’s missing',
      'You’re restless, disconnected, or struggling to find your footing',
    ],
  },
  cta: {
    buttonText: 'Work With Me',
    buttonLink: '/contact',
  },
};

// Singleton getter
coachingCmsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(defaultCoachingCmsData);
  }
  return doc;
};

coachingCmsSchema.index({ createdAt: 1 });

export const CoachingCms = mongoose.model('CoachingCms', coachingCmsSchema);
