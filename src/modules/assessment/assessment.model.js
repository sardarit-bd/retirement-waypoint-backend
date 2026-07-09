import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  score: { type: Number, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  required: { type: Boolean, default: true },
  options: [optionSchema],
}, { _id: false });

const domainSchema = new mongoose.Schema({
  id: { type: String, required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, default: '#534AB7' },
  reflection: {
    question: { type: String, default: '' },
  },
  questions: [questionSchema],
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  text: { type: String, default: '' },
}, { _id: false });

const rangeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  minScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  description: { type: String, required: true },
  color: { type: String, default: '#10b981' },
  recommendations: [recommendationSchema],
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  hero: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
  },
  introduction: {
    badge: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, default: '10–12 min' },
    ctaButton: { type: String, default: 'Begin Assessment' },
  },
  domains: [domainSchema],
  results: {
    ranges: [rangeSchema],
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  // Soft delete fields
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  deletedBy: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// ============================
// Indexes
// ============================
assessmentSchema.index({ slug: 1 });
assessmentSchema.index({ status: 1, deletedAt: 1 });
assessmentSchema.index({ createdAt: -1 });
assessmentSchema.index({ status: 1, createdAt: -1 });

// ============================
// Virtuals - Computed Values
// ============================

// Domain count (computed, not stored)
assessmentSchema.virtual('domainCount').get(function() {
  return this.domains?.length || 0;
});

// Total questions (computed, not stored)
assessmentSchema.virtual('totalQuestions').get(function() {
  return this.domains?.reduce((total, domain) => {
    return total + (domain.questions?.length || 0);
  }, 0) || 0;
});

// Reflection count (computed, not stored)
assessmentSchema.virtual('reflectionCount').get(function() {
  return this.domains?.filter(d => d.reflection?.question?.trim()).length || 0;
});

// Check if soft deleted
assessmentSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Check if published
assessmentSchema.virtual('isPublished').get(function() {
  return this.status === 'published' && this.deletedAt === null;
});

// Check if draft
assessmentSchema.virtual('isDraft').get(function() {
  return this.status === 'draft' && this.deletedAt === null;
});

// ============================
// Ensure virtuals are included in JSON output
// ============================
assessmentSchema.set('toJSON', { virtuals: true });
assessmentSchema.set('toObject', { virtuals: true });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;