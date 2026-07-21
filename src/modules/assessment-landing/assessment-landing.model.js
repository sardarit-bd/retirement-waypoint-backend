import mongoose from 'mongoose';

const landingSchema = new mongoose.Schema({
  badge: {
    type: String,
    required: true,
    default: 'Retirement Waypoint',
    trim: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Choose Your Assessment',
    trim: true,
  },
  subtitle: {
    type: String,
    required: true,
    default: 'Select the assessment that best matches your current retirement stage.',
    trim: true,
  },
  description: {
    type: String,
    required: true,
    default: 'Each assessment draws on psychological research and includes reflection questions that will be analyzed alongside the assessment items to provide a complete and transparent measure of your current retirement readiness and overall status.',
    trim: true,
  },
  updatedBy: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Ensure only one document exists
landingSchema.statics.getSingleton = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

// Index for singleton
landingSchema.index({ createdAt: 1 });

export const AssessmentLanding = mongoose.model('AssessmentLanding', landingSchema);