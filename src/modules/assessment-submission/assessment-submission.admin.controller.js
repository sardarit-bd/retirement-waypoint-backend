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

  /**
   * Export assessment responses (admin)
   * GET /api/admin/assessment-participants/export
   */
  async exportParticipants(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const file = await AssessmentSubmissionService.exportParticipants(query);

      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      return res.status(200).send(file.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get participant history by email (admin)
   * GET /api/admin/assessment-participants/history/:email
   */
  async getParticipantHistory(req, res, next) {
    try {
      const { email } = req.params;
      const history = await AssessmentSubmissionService.getParticipantHistory(decodeURIComponent(email));
      return sendResponse(res, {
        message: 'Participant history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentSubmissionAdminController();