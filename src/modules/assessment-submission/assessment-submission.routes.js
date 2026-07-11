import { Router } from 'express';
import AssessmentSubmissionController from './assessment-submission.controller.js';
import {
  submitAssessmentValidation,
  getSubmissionByIdValidation,
  getSubmissionsByEmailValidation,
  getSubmissionsByAssessmentValidation,
  validate,
} from './assessment-submission.validation.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Submit assessment (public - no auth required)
router.post(
  '/:slug/submit',
  validate(submitAssessmentValidation),
  AssessmentSubmissionController.submit
);

// ============================
// PROTECTED ROUTES
// ============================

// Get submission by ID (requires auth)
router.get(
  '/:id',
  protect,
  validate(getSubmissionByIdValidation),
  AssessmentSubmissionController.getById
);

// Get submissions by email (requires auth)
router.get(
  '/email/:email',
  protect,
  validate(getSubmissionsByEmailValidation),
  AssessmentSubmissionController.getByEmail
);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get submissions by assessment (admin)
router.get(
  '/assessment/:assessmentId',
  validate(getSubmissionsByAssessmentValidation),
  AssessmentSubmissionController.getByAssessment
);

// Get submission stats (admin)
router.get('/stats', AssessmentSubmissionController.getStats);

export const AssessmentSubmissionRoutes = router;
export default router;