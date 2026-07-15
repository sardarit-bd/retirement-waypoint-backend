import AssessmentSubmissionService from './assessment-submission.service.js';
import sendResponse from '../../utils/sendResponse.js';

class AssessmentSubmissionAdminController {
  /**
   * Get all submissions with filters (admin)
   * GET /api/admin/assessment-participants
   */
  async getParticipants(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await AssessmentSubmissionService.getParticipants(query);

      return sendResponse(res, {
        message: 'Participants retrieved successfully',
        data: result.submissions,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submission stats (admin)
   * GET /api/admin/assessment-participants/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await AssessmentSubmissionService.getParticipantStats();
      return sendResponse(res, {
        message: 'Participant stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get submission by ID (admin)
   * GET /api/admin/assessment-participants/:id
   */
  async getParticipantById(req, res, next) {
    try {
      const submission = await AssessmentSubmissionService.getSubmissionById(req.params.id);
      return sendResponse(res, {
        message: 'Participant retrieved successfully',
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentSubmissionAdminController();