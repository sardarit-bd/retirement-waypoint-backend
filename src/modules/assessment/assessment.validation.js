import { z } from 'zod';

// Option schema
const optionSchema = z.object({
  label: z.string().min(1, 'Option label is required'),
  value: z.number().int().min(0, 'Option value must be a positive integer'),
  score: z.number().int().min(0, 'Option score must be a positive integer'),
});

// Question schema
const questionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  text: z.string().min(1, 'Question text is required'),
  required: z.boolean().default(true),
  options: z.array(optionSchema).min(2, 'At least 2 options are required'),
});

// Domain schema
const domainSchema = z.object({
  id: z.string().min(1, 'Domain ID is required'),
  key: z.string().min(1, 'Domain key is required'),
  label: z.string().min(1, 'Domain label is required'),
  description: z.string().min(1, 'Domain description is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
  reflection: z.object({
    question: z.string().default(''),
  }),
  questions: z.array(questionSchema).default([]),
});

// Recommendation schema
const recommendationSchema = z.object({
  text: z.string().default(''),
});

// Range schema
const rangeSchema = z.object({
  id: z.string().min(1, 'Range ID is required'),
  title: z.string().min(1, 'Range title is required'),
  minScore: z.number().int().min(0, 'Min score must be between 0 and 100'),
  maxScore: z.number().int().max(100, 'Max score must be between 0 and 100'),
  description: z.string().min(1, 'Range description is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
  recommendations: z.array(recommendationSchema).default([]),
});

// Complete Assessment schema
// questionCount and reflectionCount are now computed via virtuals
const assessmentSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  hero: z.object({
    title: z.string().min(1, 'Hero title is required'),
    subtitle: z.string().min(1, 'Hero subtitle is required'),
    description: z.string().min(1, 'Hero description is required'),
  }),
  introduction: z.object({
    badge: z.string().min(1, 'Badge is required'),
    title: z.string().min(1, 'Introduction title is required'),
    author: z.string().default('David Allen, Ph.D.'),
    subtitle: z.string().min(1, 'Introduction subtitle is required'),
    description: z.string().min(1, 'Introduction description is required'),
    duration: z.string().default('10–12 min'),
    ctaButton: z.string().default('Begin Assessment'),
  }),
  domains: z.array(domainSchema).min(1, 'At least 1 domain is required'),
  results: z.object({
    ranges: z.array(rangeSchema).min(1, 'At least 1 result range is required'),
  }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  // These fields are read-only and computed via virtuals
  // They should not be accepted in request body
}).strict(); // Disallow extra fields

// Validation for creating assessment
const createAssessmentValidation = z.object({
  body: assessmentSchema,
});

// Validation for updating assessment
const updateAssessmentValidation = z.object({
  body: assessmentSchema.partial().strict(),
});

// Validation for slug param
const slugParamValidation = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

// Validation for ID param
const idParamValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
});

// Validation for pagination query
const paginationQueryValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().optional(),
    includeDeleted: z.string().regex(/^(true|false)$/).optional(),
  }),
});

// Submission validation
const submissionAnswerSchema = z.object({
  questionId: z.string().min(1),
  domainId: z.string().min(1),
  value: z.number().int().min(0),
  score: z.number().int().min(0),
});

const submissionReflectionSchema = z.object({
  domainId: z.string().min(1),
  domainKey: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().max(5000),
});

const submissionParticipantSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().min(1).email().max(255).trim().toLowerCase(),
});

const submissionSchema = z.object({
  participant: submissionParticipantSchema,
  answers: z.array(submissionAnswerSchema).min(1),
  reflections: z.array(submissionReflectionSchema).default([]),
  userId: z.string().optional().nullable(),
});

export const submitAssessmentValidation = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  body: submissionSchema,
});

export {
  createAssessmentValidation,
  updateAssessmentValidation,
  slugParamValidation,
  idParamValidation,
  paginationQueryValidation,
  assessmentSchema,
  submissionSchema,
  submissionAnswerSchema,
  submissionReflectionSchema,
  submissionParticipantSchema,
};