import { Router } from "express";
import ContactAdminController from "./contact.admin.controller.js";
import {
  getContactMessagesValidation,
  contactIdParamValidation,
  updateContactStatusValidation,
  validate,
} from "./contact.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

// Get messages with search/filter/pagination
router.get(
  "/",
  validate(getContactMessagesValidation),
  ContactAdminController.getMessages
);

// Get message stats
router.get("/stats", ContactAdminController.getStats);

// Get unread count (dashboard summary card)
router.get("/unread-count", ContactAdminController.getUnreadCount);

// Get message by ID
router.get(
  "/:id",
  validate(contactIdParamValidation),
  ContactAdminController.getMessageById
);

// Update message status
router.patch(
  "/:id/status",
  validate(updateContactStatusValidation),
  ContactAdminController.updateStatus
);

// Delete message
router.delete(
  "/:id",
  validate(contactIdParamValidation),
  ContactAdminController.deleteMessage
);

export const ContactAdminRoutes = router;
export default router;