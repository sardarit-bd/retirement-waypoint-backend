import mongoose from 'mongoose';

const valueItemSchema = new mongoose.Schema(
  {
    iconName: {
      type: String,
      default: 'Target',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const aboutCmsSchema = new mongoose.Schema(
  {
    hero: {
      badge: {
        type: String,
        default: 'Psychology Meets Purpose',
        trim: true,
      },
      title: {
        type: String,
        default: 'The Psychology Behind Retirement Waypoint',
        trim: true,
      },
      bioParagraphs: {
        type: [String],
        default: [
          'Dave holds a Ph.D. in Industrial/Organizational Psychology from Kansas State University and brings more than 40 years of experience helping people understand work, motivation, leadership, identity, and life transitions.',
          'Over the course of his career, he held leadership positions with several national consulting firms — Watson Wyatt, TRI-AD, Kenexa, and Right Management — where his work centered on organizational assessment, research identifying the drivers of employee satisfaction and engagement, coaching, and leadership development.',
          'Dave started Retirement Waypoint after going through his own transition out of full-time consulting. As he moved from a long, demanding career toward retirement, he found surprisingly few resources built to help with the psychological side of that shift — the questions of identity, the loss of daily structure and purpose, and the work of building a genuinely fulfilling life after work. Drawing on decades spent researching what makes people thrive professionally, he created Retirement Waypoint to close that gap: a resource grounded in psychological science, not just financial planning, to help other professionals move into retirement with the same clarity and intention they brought to their careers.',
        ],
      },
      credentials: {
        type: [String],
        default: [
          '40+ Years Experience',
          'Industrial Psychologist',
          'Retirement Transition Specialist',
        ],
      },
      profileImage: {
        type: String,
        default: '/images/about/dave-story-2.png',
        trim: true,
      },
    },

    missionVision: {
      title: {
        type: String,
        default: 'A More Human Way To Approach Retirement',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Retirement Waypoint exists to bring emotional clarity, structure, and purpose to one of life’s most meaningful transitions.',
        trim: true,
      },
      mission: {
        title: {
          type: String,
          default: 'Mission',
          trim: true,
        },
        description: {
          type: String,
          default:
            'Helping professionals thrive emotionally and psychologically in retirement.',
          trim: true,
        },
        iconName: {
          type: String,
          default: 'HeartHandshake',
          trim: true,
        },
      },
      vision: {
        title: {
          type: String,
          default: 'Vision',
          trim: true,
        },
        description: {
          type: String,
          default:
            'A future where retirement is approached with clarity, structure, and purpose.',
          trim: true,
        },
        iconName: {
          type: String,
          default: 'Lightbulb',
          trim: true,
        },
      },
    },

    coreValues: {
      title: {
        type: String,
        default: 'The Values Behind Retirement Waypoint',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Every part of the platform is shaped by the belief that retirement should feel guided, personal, and meaningful.',
        trim: true,
      },
      values: {
        type: [valueItemSchema],
        default: [
          {
            iconName: 'Target',
            title: 'Purpose',
            description:
              'Helping people rediscover meaning and direction beyond their professional identity.',
          },
          {
            iconName: 'Compass',
            title: 'Clarity',
            description:
              'Turning uncertainty into a clearer path for the next chapter of life.',
          },
          {
            iconName: 'ShieldCheck',
            title: 'Confidence',
            description:
              'Supporting professionals as they move forward with emotional readiness.',
          },
          {
            iconName: 'Users',
            title: 'Human Connection',
            description:
              'Recognizing that relationships, belonging, and support shape a fulfilling retirement.',
          },
        ],
      },
    },

    quoteBanner: {
      backgroundImage: {
        type: String,
        default: '/images/about/retirement-lifestyle.jpg',
        trim: true,
      },
      title: {
        type: String,
        default: 'Retirement Is Not The End Of Your Story',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'It’s the beginning of a new chapter filled with purpose, growth, and possibility.',
        trim: true,
      },
    },

    finalCta: {
      title: {
        type: String,
        default: 'Ready To Understand Your Retirement Readiness?',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Take the assessment and begin building a more meaningful retirement journey.',
        trim: true,
      },
      buttonText: {
        type: String,
        default: 'Take Assessment',
        trim: true,
      },
      buttonLink: {
        type: String,
        default: '/assessment',
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

export const defaultAboutCmsData = {
  hero: {
    badge: 'Psychology Meets Purpose',
    title: 'The Psychology Behind Retirement Waypoint',
    bioParagraphs: [
      'Dave holds a Ph.D. in Industrial/Organizational Psychology from Kansas State University and brings more than 40 years of experience helping people understand work, motivation, leadership, identity, and life transitions.',
      'Over the course of his career, he held leadership positions with several national consulting firms — Watson Wyatt, TRI-AD, Kenexa, and Right Management — where his work centered on organizational assessment, research identifying the drivers of employee satisfaction and engagement, coaching, and leadership development.',
      'Dave started Retirement Waypoint after going through his own transition out of full-time consulting. As he moved from a long, demanding career toward retirement, he found surprisingly few resources built to help with the psychological side of that shift — the questions of identity, the loss of daily structure and purpose, and the work of building a genuinely fulfilling life after work. Drawing on decades spent researching what makes people thrive professionally, he created Retirement Waypoint to close that gap: a resource grounded in psychological science, not just financial planning, to help other professionals move into retirement with the same clarity and intention they brought to their careers.',
    ],
    credentials: [
      '40+ Years Experience',
      'Industrial Psychologist',
      'Retirement Transition Specialist',
    ],
    profileImage: '/images/about/dave-story-2.png',
  },
  missionVision: {
    title: 'A More Human Way To Approach Retirement',
    subtitle:
      'Retirement Waypoint exists to bring emotional clarity, structure, and purpose to one of life’s most meaningful transitions.',
    mission: {
      title: 'Mission',
      description:
        'Helping professionals thrive emotionally and psychologically in retirement.',
      iconName: 'HeartHandshake',
    },
    vision: {
      title: 'Vision',
      description:
        'A future where retirement is approached with clarity, structure, and purpose.',
      iconName: 'Lightbulb',
    },
  },
  coreValues: {
    title: 'The Values Behind Retirement Waypoint',
    subtitle:
      'Every part of the platform is shaped by the belief that retirement should feel guided, personal, and meaningful.',
    values: [
      {
        iconName: 'Target',
        title: 'Purpose',
        description:
          'Helping people rediscover meaning and direction beyond their professional identity.',
      },
      {
        iconName: 'Compass',
        title: 'Clarity',
        description:
          'Turning uncertainty into a clearer path for the next chapter of life.',
      },
      {
        iconName: 'ShieldCheck',
        title: 'Confidence',
        description:
          'Supporting professionals as they move forward with emotional readiness.',
      },
      {
        iconName: 'Users',
        title: 'Human Connection',
        description:
          'Recognizing that relationships, belonging, and support shape a fulfilling retirement.',
      },
    ],
  },
  quoteBanner: {
    backgroundImage: '/images/about/retirement-lifestyle.jpg',
    title: 'Retirement Is Not The End Of Your Story',
    subtitle:
      'It’s the beginning of a new chapter filled with purpose, growth, and possibility.',
  },
  finalCta: {
    title: 'Ready To Understand Your Retirement Readiness?',
    subtitle:
      'Take the assessment and begin building a more meaningful retirement journey.',
    buttonText: 'Take Assessment',
    buttonLink: '/assessment',
  },
};

// Singleton getter
aboutCmsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(defaultAboutCmsData);
  }
  return doc;
};

aboutCmsSchema.index({ createdAt: 1 });

export const AboutCms = mongoose.model('AboutCms', aboutCmsSchema);
