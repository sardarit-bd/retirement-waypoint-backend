import { Router } from 'express';
import ContactCmsController from './contact-cms.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { updateContactCmsValidation, validate } from './contact-cms.validation.js';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================

// Get contact content (public)
router.get('/', ContactCmsController.getContactContent);

// ============================
// ADMIN ROUTES
// ============================

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Get contact content (admin)
router.get('/admin', ContactCmsController.getContactContentAdmin);

// Update contact content (admin - with or without ID)
router.patch(
  '/admin',
  validate(updateContactCmsValidation),
  ContactCmsController.updateContactContent
);

router.patch(
  '/admin/:id',
  validate(updateContactCmsValidation),
  ContactCmsController.updateContactContent
);

export const ContactCmsRoutes = router;
export default router;
