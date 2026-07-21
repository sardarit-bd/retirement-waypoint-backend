import NewsletterService from "./newsletter.service.js";
import sendResponse from "../../utils/sendResponse.js";

class NewsletterAdminController {
  /**
   * Get all subscribers with search/filter/pagination
   * GET /api/admin/newsletter
   */
  async getSubscribers(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await NewsletterService.getSubscribers(query);

      return sendResponse(res, {
        message: "Subscribers retrieved successfully",
        data: result.subscribers,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subscriber stats (also powers the dashboard summary card)
   * GET /api/admin/newsletter/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await NewsletterService.getStats();

      return sendResponse(res, {
        message: "Subscriber stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export subscribers as CSV or Excel
   * GET /api/admin/newsletter/export
   */
  async exportSubscribers(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const { buffer, contentType, filename } =
        await NewsletterService.exportSubscribers(query);

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single subscriber by ID
   * GET /api/admin/newsletter/:id
   */
  async getSubscriberById(req, res, next) {
    try {
      const subscriber = await NewsletterService.getSubscriberById(
        req.params.id
      );

      return sendResponse(res, {
        message: "Subscriber retrieved successfully",
        data: subscriber,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a subscriber's status (activate / unsubscribe)
   * PATCH /api/admin/newsletter/:id
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const subscriber = await NewsletterService.updateStatus(id, status);

      return sendResponse(res, {
        message: "Subscriber status updated successfully",
        data: subscriber,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a subscriber
   * DELETE /api/admin/newsletter/:id
   */
  async deleteSubscriber(req, res, next) {
    try {
      const result = await NewsletterService.deleteSubscriber(req.params.id);

      return sendResponse(res, {
        message: "Subscriber deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsletterAdminController();