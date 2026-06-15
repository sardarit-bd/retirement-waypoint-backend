import express from "express";
import { PurchaseController } from "./purchase.controller.js";
import {
  getUserPurchasesValidation,
  checkPurchaseByBookValidation,
  getPurchaseByIdValidation,
  getAllPurchasesValidation,
  revokeAccessValidation,
  validate,
} from "./purchase.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All purchase routes require authentication
router.use(protect);

// User routes
router.get(
  "/my-purchases",
  validate(getUserPurchasesValidation),
  PurchaseController.getMyPurchases,
);
router.get(
  "/check/:bookId",
  validate(checkPurchaseByBookValidation),
  PurchaseController.checkPurchaseByBook,
);
router.get(
  "/book/:bookId",
  validate(checkPurchaseByBookValidation),
  PurchaseController.getPurchaseByBook,
);
router.get(
  "/:id",
  validate(getPurchaseByIdValidation),
  PurchaseController.getPurchaseById,
);

// Admin only routes
router.get(
  "/",
  restrictTo("admin"),
  validate(getAllPurchasesValidation),
  PurchaseController.getAllPurchases,
);

router.get(
  "/my-purchases-with-details",
  validate(getUserPurchasesValidation),
  PurchaseController.getMyPurchasesWithDetails,
);

router.get(
  "/:id/with-details",
  validate(getPurchaseByIdValidation),
  PurchaseController.getPurchaseWithBookDetails,
);

router.patch(
  "/:id/revoke",
  restrictTo("admin"),
  validate(revokeAccessValidation),
  PurchaseController.revokeAccess,
);
router.patch(
  "/:id/restore",
  restrictTo("admin"),
  validate(revokeAccessValidation),
  PurchaseController.restoreAccess,
);

export const PurchaseRoutes = router;
