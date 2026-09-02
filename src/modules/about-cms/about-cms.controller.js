import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import AboutCmsService from './about-cms.service.js';

class AboutCmsController {
  /**
   * Get About CMS content (Public)
   */
  getAboutContent = catchAsync(async (req, res) => {
    const data = await AboutCmsService.getAboutContent();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'About page content retrieved successfully',
      data,
    });
  });

  /**
   * Get About CMS content (Admin)
   */
  getAboutContentAdmin = catchAsync(async (req, res) => {
    const data = await AboutCmsService.getAboutContentAdmin();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'About page CMS content retrieved successfully (Admin)',
      data,
    });
  });

  /**
   * Update About CMS content (Admin)
   */
  updateAboutContent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id || 'admin';
    console.log('➡️ [About CMS Update Payload]:', {
      paramId: id,
      adminId,
      bodyKeys: Object.keys(req.body || {}),
    });

    const data = await AboutCmsService.updateAboutContent(id, req.body, adminId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'About page CMS content updated successfully',
      data,
    });
  });
}

export default new AboutCmsController();
