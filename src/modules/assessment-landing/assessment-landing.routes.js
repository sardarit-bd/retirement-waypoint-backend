import { Router } from 'express';
import AssessmentLandingController from './assessment-landing.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { idParamValidation } from '../assessment/assessment.validation.js';
import { validate } from '../upload/upload.validation.js';
import { updateLandingValidation } from './assessment-landing.validation.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Get landing content (public)
router.get(
  '/',
  AssessmentLandingController.getLanding
);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get landing content (admin)
router.get(
  '/admin',
  AssessmentLandingController.getLandingAdmin
);

// Update landing content (admin)
router.patch(
  '/admin/:id',
  validate(idParamValidation),
  validate(updateLandingValidation),
  AssessmentLandingController.updateLanding
);

export const AssessmentLandingRoutes = router;
export default router;