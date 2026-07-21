import { Router } from "express";
import NewsletterController from "./newsletter.controller.js";
import { subscribeValidation, validate } from "./newsletter.validation.js";

const router = Router();

// Public — no auth required
router.post(
  "/subscribe",
  validate(subscribeValidation),
  NewsletterController.subscribe
);

export const NewsletterRoutes = router;
export default router;