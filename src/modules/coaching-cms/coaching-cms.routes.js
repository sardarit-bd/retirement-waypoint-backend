import { Router } from 'express';
import CoachingCmsController from './coaching-cms.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { updateCoachingCmsValidation, validate } from './coaching-cms.validation.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Get coaching content (public)
router.get('/', CoachingCmsController.getCoachingContent);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get coaching content (admin)
router.get('/admin', CoachingCmsController.getCoachingContentAdmin);

// Update coaching content (admin - with or without ID)
router.patch(
  '/admin',
  validate(updateCoachingCmsValidation),
  CoachingCmsController.updateCoachingContent
);

router.patch(
  '/admin/:id',
  validate(updateCoachingCmsValidation),
  CoachingCmsController.updateCoachingContent
);

export const CoachingCmsRoutes = router;
export default router;
