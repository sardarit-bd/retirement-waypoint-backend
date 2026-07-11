import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  domainId: { type: String, required: true },
  value: { type: Number, required: true },
  score: { type: Number, required: true },
}, { _id: false });

const domainScoreSchema = new mongoose.Schema({
  domainId: { type: String, required: true },
  domainKey: { type: String, required: true },
  domainLabel: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
}, { _id: false });

const reflectionSchema = new mongoose.Schema({
  domainId: { type: String, required: true },
  domainKey: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, default: '' },  // ✅ Changed from required to default empty
}, { _id: false });

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
}, { _id: false });

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true,
  },
  assessmentSlug: {
    type: String,
    required: true,
    index: true,
  },
  participant: {
    type: participantSchema,
    required: true,
  },
  userId: {
    type: String,
    default: null,
    index: true,
  },
  answers: [answerSchema],
  reflections: [reflectionSchema],
  domainScores: [domainScoreSchema],
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  resultRange: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, required: true },
  },
  recommendations: [{
    text: { type: String },
  }],
  completedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for analytics
assessmentSubmissionSchema.index({ userId: 1, completedAt: -1 });
assessmentSubmissionSchema.index({ assessmentId: 1, completedAt: -1 });
assessmentSubmissionSchema.index({ assessmentSlug: 1, completedAt: -1 });
assessmentSubmissionSchema.index({ 'participant.email': 1, completedAt: -1 });

export const AssessmentSubmission = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);