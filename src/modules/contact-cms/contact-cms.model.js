import mongoose from 'mongoose';

const contactCmsSchema = new mongoose.Schema(
  {
    header: {
      badge: {
        type: String,
        default: 'Contact Retirement Waypoint',
        trim: true,
      },
      title: {
        type: String,
        default: 'Let’s Start The Conversation',
        trim: true,
      },
      subtitle: {
        type: String,
        default:
          'Have questions about assessments, books, or retirement transition guidance? Send a message and we’ll get back to you.',
        trim: true,
      },
    },

    contactInfo: {
      sectionTitle: {
        type: String,
        default: 'Contact Information',
        trim: true,
      },
      sectionSubtitle: {
        type: String,
        default:
          'Reach out for questions, support, or collaboration opportunities.',
        trim: true,
      },
      email: {
        type: String,
        default: 'dave@retirementwaypoint.com',
        trim: true,
      },
      phone: {
        type: String,
        default: '+1 (760) 960-0162',
        trim: true,
      },
    },

    promoCard: {
      title: {
        type: String,
        default: 'Not Sure Where To Start?',
        trim: true,
      },
      description: {
        type: String,
        default:
          'Take the retirement readiness assessment to understand your current transition profile.',
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

    formInfo: {
      formTitle: {
        type: String,
        default: 'Send A Message',
        trim: true,
      },
      formSubtitle: {
        type: String,
        default:
          'Fill out the form below and we’ll respond as soon as possible.',
        trim: true,
      },
      submitButtonText: {
        type: String,
        default: 'Send Message',
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

export const defaultContactCmsData = {
  header: {
    badge: 'Contact Retirement Waypoint',
    title: 'Let’s Start The Conversation',
    subtitle:
      'Have questions about assessments, books, or retirement transition guidance? Send a message and we’ll get back to you.',
  },
  contactInfo: {
    sectionTitle: 'Contact Information',
    sectionSubtitle:
      'Reach out for questions, support, or collaboration opportunities.',
    email: 'dave@retirementwaypoint.com',
    phone: '+1 (760) 960-0162',
  },
  promoCard: {
    title: 'Not Sure Where To Start?',
    description:
      'Take the retirement readiness assessment to understand your current transition profile.',
    buttonText: 'Take Assessment',
    buttonLink: '/assessment',
  },
  formInfo: {
    formTitle: 'Send A Message',
    formSubtitle:
      'Fill out the form below and we’ll respond as soon as possible.',
    submitButtonText: 'Send Message',
  },
};

// Singleton getter
contactCmsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(defaultContactCmsData);
  }
  return doc;
};

contactCmsSchema.index({ createdAt: 1 });

export const ContactCms = mongoose.model('ContactCms', contactCmsSchema);
