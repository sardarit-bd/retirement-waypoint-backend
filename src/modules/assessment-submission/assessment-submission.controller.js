import AssessmentSubmissionService from './assessment-submission.service.js';
import sendResponse from '../../utils/sendResponse.js';

class AssessmentSubmissionController {
  /**
   * Submit assessment
   * POST /api/assessments/:slug/submit
   */
  async submit(req, res, next) {
    try {
      const { slug } = req.params;
      const result = await AssessmentSubmissionService.submitAssessment(slug, {
        ...req.body,
        userId: req.user?.id || null,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: 'Assessment submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submission by ID
   * GET /api/assessment-submissions/:id
   */
  async getById(req, res, next) {
    try {
      const submission = await AssessmentSubmissionService.getSubmissionById(req.params.id);
      return sendResponse(res, {
        message: 'Submission retrieved successfully',
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submissions by email
   * GET /api/assessment-submissions/email/:email
   */
  async getByEmail(req, res, next) {
    try {
      const { email } = req.params;
      const query = req.validatedQuery || req.query;
      const result = await AssessmentSubmissionService.getSubmissionsByEmail(email, query);

      return sendResponse(res, {
        message: 'Submissions retrieved successfully',
        data: result.submissions,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submissions by assessment
   * GET /api/assessment-submissions/assessment/:assessmentId
   */
  async getByAssessment(req, res, next) {
    try {
      const { assessmentId } = req.params;
      const query = req.validatedQuery || req.query;
      const result = await AssessmentSubmissionService.getSubmissionsByAssessment(assessmentId, query);

      return sendResponse(res, {
        message: 'Submissions retrieved successfully',
        data: result.submissions,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submission stats
   * GET /api/assessment-submissions/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await AssessmentSubmissionService.getStats();
      return sendResponse(res, {
        message: 'Submission stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentSubmissionController();