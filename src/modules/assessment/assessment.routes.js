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
import assessmentSubmissionController from '../assessment-submission/assessment-submission.controller.js';
import { submitAssessmentValidation } from '../assessment-submission/assessment-submission.validation.js';

// ============================
// Validation Middleware (inline)
// ============================
const validateSchema = (schema) => {
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

// List published assessments
router.get(
  '/public',
  validateSchema(paginationQueryValidation),
  AssessmentController.listPublic
);

// Get published assessment by slug
router.get(
  '/public/:slug',
  validateSchema(slugParamValidation),
  AssessmentController.getPublicBySlug
);

// Submit assessment (public - no auth required)
router.post(
  '/:slug/submit',
  validateSchema(submitAssessmentValidation),
  assessmentSubmissionController.submit
);

/* ===========================
   Protected Admin Routes
=========================== */

router.use(protect);
router.use(restrictTo('admin'));

// List all assessments (with filters)
router.get(
  '/',
  validateSchema(paginationQueryValidation),
  AssessmentController.list
);

// List soft deleted assessments
router.get(
  '/deleted',
  validateSchema(paginationQueryValidation),
  AssessmentController.listDeleted
);

// Get assessment statistics
router.get('/stats', AssessmentController.getStats);

// Get assessment by ID
router.get(
  '/:id',
  validateSchema(idParamValidation),
  AssessmentController.getById
);

// Get assessment by slug (includes drafts)
router.get(
  '/slug/:slug',
  validateSchema(slugParamValidation),
  AssessmentController.getBySlug
);

// Create assessment
router.post(
  '/',
  validateSchema(createAssessmentValidation),
  AssessmentController.create
);

// Update assessment
router.patch(
  '/:id',
  validateSchema(idParamValidation),
  validateSchema(updateAssessmentValidation),
  AssessmentController.update
);

// Soft delete assessment
router.delete(
  '/:id',
  validateSchema(idParamValidation),
  AssessmentController.delete
);

// Restore soft deleted assessment
router.patch(
  '/:id/restore',
  validateSchema(idParamValidation),
  AssessmentController.restore
);

// Duplicate assessment
router.post(
  '/:id/duplicate',
  validateSchema(idParamValidation),
  AssessmentController.duplicate
);

// Publish assessment
router.patch(
  '/:id/publish',
  validateSchema(idParamValidation),
  AssessmentController.publish
);

// Archive assessment
router.patch(
  '/:id/archive',
  validateSchema(idParamValidation),
  AssessmentController.archive
);

export { router as AssessmentRoutes };
export default router;