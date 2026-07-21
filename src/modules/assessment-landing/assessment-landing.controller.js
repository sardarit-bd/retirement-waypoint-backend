import AssessmentLandingService from './assessment-landing.service.js';
import sendResponse from '../../utils/sendResponse.js';

class AssessmentLandingController {
  /**
   * Get landing content (public)
   * GET /api/assessment-landing
   */
  async getLanding(req, res, next) {
    try {
      const landing = await AssessmentLandingService.getLanding();
      return sendResponse(res, {
        message: 'Landing content retrieved successfully',
        data: landing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get landing content (admin)
   * GET /api/admin/assessment-landing
   */
  async getLandingAdmin(req, res, next) {
    try {
      const landing = await AssessmentLandingService.getLanding();
      return sendResponse(res, {
        message: 'Landing content retrieved successfully',
        data: landing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update landing content (admin)
   * PATCH /api/admin/assessment-landing/:id
   */
  async updateLanding(req, res, next) {
    try {
      const { id } = req.params;
      const landing = await AssessmentLandingService.updateLanding(
        id,
        req.body,
        req.user?.id || null
      );
      return sendResponse(res, {
        message: 'Landing content updated successfully',
        data: landing,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentLandingController();