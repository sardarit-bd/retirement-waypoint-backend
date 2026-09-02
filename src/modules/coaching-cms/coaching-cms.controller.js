import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import CoachingCmsService from './coaching-cms.service.js';

class CoachingCmsController {
  /**
   * Get Coaching CMS content (Public)
   */
  getCoachingContent = catchAsync(async (req, res) => {
    const data = await CoachingCmsService.getCoachingContent();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Coaching page content retrieved successfully',
      data,
    });
  });

  /**
   * Get Coaching CMS content (Admin)
   */
  getCoachingContentAdmin = catchAsync(async (req, res) => {
    const data = await CoachingCmsService.getCoachingContentAdmin();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Coaching page CMS content retrieved successfully (Admin)',
      data,
    });
  });

  /**
   * Update Coaching CMS content (Admin)
   */
  updateCoachingContent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id || 'admin';
    console.log('➡️ [Coaching CMS Update Payload]:', {
      paramId: id,
      adminId,
      bodyKeys: Object.keys(req.body || {}),
    });

    const data = await CoachingCmsService.updateCoachingContent(id, req.body, adminId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Coaching page CMS content updated successfully',
      data,
    });
  });
}

export default new CoachingCmsController();
