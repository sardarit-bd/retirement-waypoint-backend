import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import ContactCmsService from './contact-cms.service.js';

class ContactCmsController {
  /**
   * Get Contact CMS content (Public)
   */
  getContactContent = catchAsync(async (req, res) => {
    const data = await ContactCmsService.getContactContent();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Contact page content retrieved successfully',
      data,
    });
  });

  /**
   * Get Contact CMS content (Admin)
   */
  getContactContentAdmin = catchAsync(async (req, res) => {
    const data = await ContactCmsService.getContactContentAdmin();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Contact page CMS content retrieved successfully (Admin)',
      data,
    });
  });

  /**
   * Update Contact CMS content (Admin)
   */
  updateContactContent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id || 'admin';
    console.log('➡️ [Contact CMS Update Payload]:', {
      paramId: id,
      adminId,
      bodyKeys: Object.keys(req.body || {}),
    });

    const data = await ContactCmsService.updateContactContent(id, req.body, adminId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Contact page CMS content updated successfully',
      data,
    });
  });
}

export default new ContactCmsController();
