import { Router } from "express";
import { submitContactValidation, validate } from "./contact.validation.js";
import { ContactController } from "./contact-index.js";
// import ContactController from "./contact.controller.js";
// import { submitContactValidation, validate } from "./contact.validation.js";

const router = Router();

// Public — no auth required
router.post(
  "/",
  validate(submitContactValidation),
  ContactController.submit
);

export const ContactRoutes = router;
export default router;