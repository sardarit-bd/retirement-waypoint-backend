import ContactService from "./contact.service.js";
import sendResponse from "../../utils/sendResponse.js";

class ContactAdminController {
  /**
   * Get all contact messages with search/filter/pagination
   * GET /api/admin/contact-messages
   */
  async getMessages(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await ContactService.getMessages(query);

      return sendResponse(res, {
        message: "Contact messages retrieved successfully",
        data: result.messages,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get contact message stats
   * GET /api/admin/contact-messages/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await ContactService.getStats();

      return sendResponse(res, {
        message: "Contact message stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count (for dashboard summary card)
   * GET /api/admin/contact-messages/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const result = await ContactService.getUnreadCount();

      return sendResponse(res, {
        message: "Unread count retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single contact message by ID
   * GET /api/admin/contact-messages/:id
   */
  async getMessageById(req, res, next) {
    try {
      const message = await ContactService.getMessageById(req.params.id);

      return sendResponse(res, {
        message: "Contact message retrieved successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a contact message's status
   * PATCH /api/admin/contact-messages/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const message = await ContactService.updateStatus(id, status);

      return sendResponse(res, {
        message: "Contact message status updated successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a contact message
   * DELETE /api/admin/contact-messages/:id
   */
  async deleteMessage(req, res, next) {
    try {
      const result = await ContactService.deleteMessage(req.params.id);

      return sendResponse(res, {
        message: "Contact message deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ContactAdminController();