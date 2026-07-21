import NewsletterService from "./newsletter.service.js";
import sendResponse from "../../utils/sendResponse.js";

class NewsletterController {
  /**
   * Subscribe to the newsletter
   * POST /api/newsletter/subscribe
   */
  async subscribe(req, res, next) {
    try {
      const { email, source } = req.body;

      const result = await NewsletterService.subscribe(email, source);

      return sendResponse(res, {
        statusCode: 201,
        message: "You've successfully subscribed to our newsletter!",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsletterController();