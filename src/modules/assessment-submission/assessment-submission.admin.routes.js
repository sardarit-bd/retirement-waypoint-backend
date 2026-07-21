import { Router } from 'express';
import AssessmentSubmissionAdminController from './assessment-submission.admin.controller.js';
import {
  getParticipantsValidation,
  getParticipantByIdValidation,
  validate,
} from './assessment-submission.admin.validation.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get participants with filters
router.get(
  '/',
  validate(getParticipantsValidation),
  AssessmentSubmissionAdminController.getParticipants
);

// Get participant stats
router.get(
  '/stats',
  AssessmentSubmissionAdminController.getStats
);

// Get participant by ID
router.get(
  '/:id',
  validate(getParticipantByIdValidation),
  AssessmentSubmissionAdminController.getParticipantById
);

export default router;