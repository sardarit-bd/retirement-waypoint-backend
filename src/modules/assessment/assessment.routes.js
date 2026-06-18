import express from "express";
import { AssessmentController } from "./assessment.controller.js";
import {
  createAssessmentTypeValidation,
  updateAssessmentTypeValidation,
  getAssessmentTypesValidation,
  createAssessmentPageValidation,
  updateAssessmentPageValidation,
  getAssessmentPagesValidation,
  createAssessmentSectionValidation,
  updateAssessmentSectionValidation,
  getAssessmentSectionsValidation,
  createQuestionValidation,
  updateQuestionValidation,
  getQuestionsValidation,
  createQuestionOptionValidation,
  updateQuestionOptionValidation,
  createResultRangeValidation,
  updateResultRangeValidation,
  getResultRangesValidation,
  createRecommendationValidation,
  updateRecommendationValidation,
  submitAssessmentValidation,
  getSubmissionsValidation,
  getPublicAssessmentValidation,
  getPublicAssessmentResultsValidation,
  getAssessmentAnalyticsValidation,
  validate,
} from "./assessment.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get assessment by slug
router.get(
  "/public/:slug",
  validate(getPublicAssessmentValidation),
  AssessmentController.getPublicAssessment
);

// Get assessment result by submission ID
router.get(
  "/public/result/:submissionId",
  validate(getPublicAssessmentResultsValidation),
  AssessmentController.getPublicAssessmentResult
);

// ==================== USER ROUTES (Authenticated) ====================
router.use(protect);

// Submit assessment
router.post(
  "/submit",
  validate(submitAssessmentValidation),
  AssessmentController.submitAssessment
);

// Get user submissions
router.get(
  "/my-submissions",
  validate(getSubmissionsValidation),
  AssessmentController.getUserSubmissions
);

// Get submission by ID
router.get(
  "/my-submissions/:id",
  AssessmentController.getSubmissionById
);

// ==================== ADMIN ROUTES ====================
router.use(restrictTo("admin"));

// ==================== ASSESSMENT TYPE ====================
router.post(
  "/admin/types",
  validate(createAssessmentTypeValidation),
  AssessmentController.createAssessmentType
);
router.patch(
  "/admin/types/:id",
  validate(updateAssessmentTypeValidation),
  AssessmentController.updateAssessmentType
);
router.delete(
  "/admin/types/:id",
  AssessmentController.deleteAssessmentType
);
router.get(
  "/admin/types",
  validate(getAssessmentTypesValidation),
  AssessmentController.getAssessmentTypes
);
router.get(
  "/admin/types/:id",
  AssessmentController.getAssessmentTypeById
);

// ==================== ASSESSMENT PAGE ====================
router.post(
  "/admin/pages",
  validate(createAssessmentPageValidation),
  AssessmentController.createAssessmentPage
);
router.patch(
  "/admin/pages/:id",
  validate(updateAssessmentPageValidation),
  AssessmentController.updateAssessmentPage
);
router.delete(
  "/admin/pages/:id",
  AssessmentController.deleteAssessmentPage
);
router.get(
  "/admin/pages",
  validate(getAssessmentPagesValidation),
  AssessmentController.getAssessmentPages
);
router.get(
  "/admin/pages/:id",
  AssessmentController.getAssessmentPageById
);

// ==================== ASSESSMENT SECTION ====================
router.post(
  "/admin/sections",
  validate(createAssessmentSectionValidation),
  AssessmentController.createAssessmentSection
);
router.patch(
  "/admin/sections/:id",
  validate(updateAssessmentSectionValidation),
  AssessmentController.updateAssessmentSection
);
router.delete(
  "/admin/sections/:id",
  AssessmentController.deleteAssessmentSection
);
router.get(
  "/admin/sections",
  validate(getAssessmentSectionsValidation),
  AssessmentController.getAssessmentSections
);
router.get(
  "/admin/sections/:id",
  AssessmentController.getAssessmentSectionById
);

// ==================== QUESTION ====================
router.post(
  "/admin/questions",
  validate(createQuestionValidation),
  AssessmentController.createQuestion
);
router.patch(
  "/admin/questions/:id",
  validate(updateQuestionValidation),
  AssessmentController.updateQuestion
);
router.delete(
  "/admin/questions/:id",
  AssessmentController.deleteQuestion
);
router.get(
  "/admin/questions",
  validate(getQuestionsValidation),
  AssessmentController.getQuestions
);
router.get(
  "/admin/questions/:id",
  AssessmentController.getQuestionById
);

// ==================== QUESTION OPTION ====================
router.post(
  "/admin/options",
  validate(createQuestionOptionValidation),
  AssessmentController.createQuestionOption
);
router.patch(
  "/admin/options/:id",
  validate(updateQuestionOptionValidation),
  AssessmentController.updateQuestionOption
);
router.delete(
  "/admin/options/:id",
  AssessmentController.deleteQuestionOption
);
router.get(
  "/admin/options/question/:questionId",
  AssessmentController.getQuestionOptions
);

// ==================== RESULT RANGE ====================
router.post(
  "/admin/result-ranges",
  validate(createResultRangeValidation),
  AssessmentController.createResultRange
);
router.patch(
  "/admin/result-ranges/:id",
  validate(updateResultRangeValidation),
  AssessmentController.updateResultRange
);
router.delete(
  "/admin/result-ranges/:id",
  AssessmentController.deleteResultRange
);
router.get(
  "/admin/result-ranges",
  validate(getResultRangesValidation),
  AssessmentController.getResultRanges
);
router.get(
  "/admin/result-ranges/:id",
  AssessmentController.getResultRangeById
);

// ==================== RECOMMENDATION ====================
router.post(
  "/admin/recommendations",
  validate(createRecommendationValidation),
  AssessmentController.createRecommendation
);
router.patch(
  "/admin/recommendations/:id",
  validate(updateRecommendationValidation),
  AssessmentController.updateRecommendation
);
router.delete(
  "/admin/recommendations/:id",
  AssessmentController.deleteRecommendation
);
router.get(
  "/admin/recommendations/result-range/:resultRangeId",
  AssessmentController.getRecommendations
);

// ==================== ADMIN SUBMISSIONS ====================
router.get(
  "/admin/submissions",
  validate(getSubmissionsValidation),
  AssessmentController.adminGetSubmissions
);
router.get(
  "/admin/submissions/:id",
  AssessmentController.adminGetSubmissionById
);

// ==================== ANALYTICS ====================
router.get(
  "/admin/analytics",
  validate(getAssessmentAnalyticsValidation),
  AssessmentController.getAssessmentAnalytics
);

export const AssessmentRoutes = router;