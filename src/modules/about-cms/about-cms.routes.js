import { Router } from 'express';
import AboutCmsController from './about-cms.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { updateAboutCmsValidation, validate } from './about-cms.validation.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Get about content (public)
router.get('/', AboutCmsController.getAboutContent);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get about content (admin)
router.get('/admin', AboutCmsController.getAboutContentAdmin);

// Update about content (admin - with or without ID)
router.patch(
  '/admin',
  validate(updateAboutCmsValidation),
  AboutCmsController.updateAboutContent
);

router.patch(
  '/admin/:id',
  validate(updateAboutCmsValidation),
  AboutCmsController.updateAboutContent
);

export const AboutCmsRoutes = router;
export default router;
