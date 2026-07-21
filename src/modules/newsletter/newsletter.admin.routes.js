import { Router } from "express";
import NewsletterAdminController from "./newsletter.admin.controller.js";
import {
  getSubscribersValidation,
  exportSubscribersValidation,
  subscriberIdParamValidation,
  updateSubscriberStatusValidation,
  validate,
} from "./newsletter.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

// Get subscribers with search/filter/pagination
router.get(
  "/",
  validate(getSubscribersValidation),
  NewsletterAdminController.getSubscribers
);

// Get subscriber stats (total / active / unsubscribed / new today)
router.get("/stats", NewsletterAdminController.getStats);

// Export subscribers (CSV / Excel)
router.get(
  "/export",
  validate(exportSubscribersValidation),
  NewsletterAdminController.exportSubscribers
);

// Get subscriber by ID
router.get(
  "/:id",
  validate(subscriberIdParamValidation),
  NewsletterAdminController.getSubscriberById
);

// Update subscriber status (activate / unsubscribe)
router.patch(
  "/:id",
  validate(updateSubscriberStatusValidation),
  NewsletterAdminController.updateStatus
);

// Delete subscriber
router.delete(
  "/:id",
  validate(subscriberIdParamValidation),
  NewsletterAdminController.deleteSubscriber
);

export const NewsletterAdminRoutes = router;
export default router;