import ContactService from "./contact.service.js";
import sendResponse from "../../utils/sendResponse.js";

class ContactController {
  /**
   * Submit a contact form message
   * POST /api/contact
   */
  async submit(req, res, next) {
    try {
      const ipAddress =
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers["x-forwarded-for"] ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await ContactService.submitMessage(req.body, {
        ipAddress,
        userAgent,
      });

      return sendResponse(res, {
        statusCode: 201,
        message:
          "Your message has been sent successfully. We'll get back to you soon.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ContactController();