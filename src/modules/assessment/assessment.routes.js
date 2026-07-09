import { Router } from 'express';
import AssessmentController from './assessment.controller.js';
import {
  createAssessmentValidation,
  idParamValidation,
  paginationQueryValidation,
  slugParamValidation,
  updateAssessmentValidation,
} from './assessment.validation.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

// ============================
// Validation Middleware (inline)
// ============================
const validate = (schema) => {
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

const router = Router();

/* ===========================
   Public Routes
=========================== */

router.get(
  '/public',
  validate(paginationQueryValidation),
  AssessmentController.listPublic
);

router.get(
  '/public/:slug',
  validate(slugParamValidation),
  AssessmentController.getPublicBySlug
);

/* ===========================
   Protected Admin Routes
=========================== */

router.use(protect);
router.use(restrictTo('admin'));

// List all assessments (with filters)
router.get(
  '/',
  validate(paginationQueryValidation),
  AssessmentController.list
);

// List soft deleted assessments
router.get(
  '/deleted',
  validate(paginationQueryValidation),
  AssessmentController.listDeleted
);

// Get assessment statistics
router.get('/stats', AssessmentController.getStats);

// Get assessment by ID
router.get(
  '/:id',
  validate(idParamValidation),
  AssessmentController.getById
);

// Get assessment by slug (includes drafts)
router.get(
  '/slug/:slug',
  validate(slugParamValidation),
  AssessmentController.getBySlug
);

// Create assessment
router.post(
  '/',
  validate(createAssessmentValidation),
  AssessmentController.create
);

// Update assessment
router.patch(
  '/:id',
  validate(idParamValidation),
  validate(updateAssessmentValidation),
  AssessmentController.update
);

// Soft delete assessment
router.delete(
  '/:id',
  validate(idParamValidation),
  AssessmentController.delete
);

// Restore soft deleted assessment
router.patch(
  '/:id/restore',
  validate(idParamValidation),
  AssessmentController.restore
);

// Duplicate assessment
router.post(
  '/:id/duplicate',
  validate(idParamValidation),
  AssessmentController.duplicate
);

// Publish assessment
router.patch(
  '/:id/publish',
  validate(idParamValidation),
  AssessmentController.publish
);

// Archive assessment
router.patch(
  '/:id/archive',
  validate(idParamValidation),
  AssessmentController.archive
);

export { router as AssessmentRoutes };
export default router;