import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import HomeCmsService from './home-cms.service.js';

class HomeCmsController {
  /**
   * Get Home CMS content (Public)
   */
  getHomeContent = catchAsync(async (req, res) => {
    const data = await HomeCmsService.getHomeContent();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Home page content retrieved successfully',
      data,
    });
  });

  /**
   * Get Home CMS content (Admin)
   */
  getHomeContentAdmin = catchAsync(async (req, res) => {
    const data = await HomeCmsService.getHomeContentAdmin();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Home page CMS content retrieved successfully (Admin)',
      data,
    });
  });

  /**
   * Update Home CMS content (Admin)
   */
  updateHomeContent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id || 'admin';
    console.log('➡️ [Home CMS Update Payload]:', {
      paramId: id,
      adminId,
      bodyKeys: Object.keys(req.body || {}),
    });

    const data = await HomeCmsService.updateHomeContent(id, req.body, adminId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Home page CMS content updated successfully',
      data,
    });
  });
}

export default new HomeCmsController();
