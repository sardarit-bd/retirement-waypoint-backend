import { z } from "zod";

// ==================== ASSESSMENT TYPE ====================
export const createAssessmentTypeValidation = z.object({
  body: z.object({
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    name: z.string().min(3).max(100),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.boolean().default(true),
  }),
});

export const updateAssessmentTypeValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
    name: z.string().min(3).max(100).optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

// ==================== ASSESSMENT PAGE ====================
export const createAssessmentPageValidation = z.object({
  body: z.object({
    assessmentTypeId: z.string().min(1),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    title: z.string().min(3).max(200),
    subtitle: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    heroTitle: z.string().max(200).optional().nullable(),
    heroDescription: z.string().max(500).optional().nullable(),
    buttonText: z.string().max(50).default("Start Assessment"),
    accentColor: z.string().default("#C9A84C"),
    seoTitle: z.string().max(200).optional().nullable(),
    seoDescription: z.string().max(500).optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.boolean().default(true),
  }),
});

export const updateAssessmentPageValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    assessmentTypeId: z.string().optional(),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().min(3).max(200).optional(),
    subtitle: z.string().max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    heroTitle: z.string().max(200).optional().nullable(),
    heroDescription: z.string().max(500).optional().nullable(),
    buttonText: z.string().max(50).optional(),
    accentColor: z.string().optional(),
    seoTitle: z.string().max(200).optional().nullable(),
    seoDescription: z.string().max(500).optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

// ==================== ASSESSMENT SECTION ====================
export const createAssessmentSectionValidation = z.object({
  body: z.object({
    assessmentPageId: z.string().min(1),
    key: z.string().min(2).max(50).regex(/^[a-z_]+$/),
    label: z.string().min(2).max(100),
    description: z.string().max(500).optional().nullable(),
    color: z.string().default("#534AB7"),
    openQuestion: z.string().max(500).optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateAssessmentSectionValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    key: z.string().min(2).max(50).regex(/^[a-z_]+$/).optional(),
    label: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    color: z.string().optional(),
    openQuestion: z.string().max(500).optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== QUESTION ====================
export const createQuestionValidation = z.object({
  body: z.object({
    sectionId: z.string().min(1),
    text: z.string().min(1).max(1000),
    type: z.enum(["single_choice", "multiple_choice", "scale_1_to_5", "yes_no", "text", "textarea"]),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isRequired: z.boolean().default(true),
    isActive: z.boolean().default(true),
  }),
});

export const updateQuestionValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    sectionId: z.string().optional(),
    text: z.string().min(1).max(1000).optional(),
    type: z.enum(["single_choice", "multiple_choice", "scale_1_to_5", "yes_no", "text", "textarea"]).optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== QUESTION OPTION ====================
export const createQuestionOptionValidation = z.object({
  body: z.object({
    questionId: z.string().min(1),
    label: z.string().min(1).max(200),
    value: z.coerce.number(),
    score: z.coerce.number().default(0),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateQuestionOptionValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    label: z.string().min(1).max(200).optional(),
    value: z.coerce.number().optional(),
    score: z.coerce.number().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== RESULT RANGE ====================
export const createResultRangeValidation = z.object({
  body: z.object({
    assessmentPageId: z.string().min(1),
    minScore: z.coerce.number().min(0).max(100),
    maxScore: z.coerce.number().min(0).max(100),
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional().nullable(),
    color: z.string().default("#C9A84C"),
    image: z.string().optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateResultRangeValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    minScore: z.coerce.number().min(0).max(100).optional(),
    maxScore: z.coerce.number().min(0).max(100).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional().nullable(),
    color: z.string().optional(),
    image: z.string().optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== RECOMMENDATION ====================
export const createRecommendationValidation = z.object({
  body: z.object({
    resultRangeId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    priority: z.coerce.number().int().min(1).max(5).default(1),
    bookIds: z.array(z.string()).default([]),
    resourceLinks: z.array(z.string().url()).default([]),
    ctaText: z.string().max(50).default("Learn More"),
    ctaLink: z.string().optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateRecommendationValidation = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    priority: z.coerce.number().int().min(1).max(5).optional(),
    bookIds: z.array(z.string()).optional(),
    resourceLinks: z.array(z.string().url()).optional(),
    ctaText: z.string().max(50).optional(),
    ctaLink: z.string().optional().nullable(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== SUBMISSION ====================
export const submitAssessmentValidation = z.object({
  body: z.object({
    assessmentPageId: z.string().min(1),
    answers: z.record(z.any()),
  }),
});

export const getSubmissionsValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    assessmentPageId: z.string().optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(["completedAt", "overallScore"]).default("completedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// ==================== LIST VALIDATIONS ====================
export const getAssessmentTypesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isPublished: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["displayOrder", "name", "createdAt"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const getAssessmentPagesValidation = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    assessmentTypeId: z.string().optional(),
    isPublished: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["displayOrder", "title", "createdAt"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const getAssessmentSectionsValidation = z.object({
  query: z.object({
    assessmentPageId: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["displayOrder", "label", "createdAt"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const getQuestionsValidation = z.object({
  query: z.object({
    sectionId: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["displayOrder", "createdAt"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const getResultRangesValidation = z.object({
  query: z.object({
    assessmentPageId: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["displayOrder", "minScore", "createdAt"]).default("displayOrder"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

// ==================== PUBLIC VALIDATIONS ====================
export const getPublicAssessmentValidation = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const getPublicAssessmentResultsValidation = z.object({
  params: z.object({
    submissionId: z.string().min(1),
  }),
});

// ==================== ANALYTICS ====================
export const getAssessmentAnalyticsValidation = z.object({
  query: z.object({
    assessmentPageId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

// Validate middleware helper
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.validatedQuery = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};