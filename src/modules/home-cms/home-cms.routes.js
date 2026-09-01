import { Router } from 'express';
import HomeCmsController from './home-cms.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { idParamValidation } from '../assessment/assessment.validation.js';
import { updateHomeCmsValidation, validate } from './home-cms.validation.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Get home content (public)
router.get('/', HomeCmsController.getHomeContent);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get home content (admin)
router.get('/admin', HomeCmsController.getHomeContentAdmin);

// Update home content (admin - with or without ID)
router.patch(
  '/admin',
  validate(updateHomeCmsValidation),
  HomeCmsController.updateHomeContent
);

router.patch(
  '/admin/:id',
  validate(updateHomeCmsValidation),
  HomeCmsController.updateHomeContent
);

export const HomeCmsRoutes = router;
export default router;
