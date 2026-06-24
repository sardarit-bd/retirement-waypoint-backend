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

// ============================================================
//  USER ROUTES (Specific paths FIRST, dynamic paths LAST)
// ============================================================

// 1. Get purchases with book details
router.get(
  "/my-purchases/with-details",
  validate(getUserPurchasesValidation),
  PurchaseController.getMyPurchasesWithDetails,
);

// 2. Get purchases without book details
router.get(
  "/my-purchases",
  validate(getUserPurchasesValidation),
  PurchaseController.getMyPurchases,
);

// 3. Check if user has purchased a specific book
router.get(
  "/check/:bookId",
  validate(checkPurchaseByBookValidation),
  PurchaseController.checkPurchaseByBook,
);

// 4. Get purchase by book ID
router.get(
  "/book/:bookId",
  validate(checkPurchaseByBookValidation),
  PurchaseController.getPurchaseByBook,
);

// ============================================================
//  DYNAMIC ROUTES (MUST be after specific paths)
// ============================================================

// 5. Get purchase with book details by purchase ID
//    ✅ specific pattern BEFORE generic /:id
router.get(
  "/:id/with-details",
  validate(getPurchaseByIdValidation),
  PurchaseController.getPurchaseWithBookDetails,
);

// 6. Get purchase by ID (MUST be LAST)
router.get(
  "/:id",
  validate(getPurchaseByIdValidation),
  PurchaseController.getPurchaseById,
);

// ============================================================
//  ADMIN ROUTES
// ============================================================

// 7. Get all purchases (admin only)
router.get(
  "/",
  restrictTo("admin"),
  validate(getAllPurchasesValidation),
  PurchaseController.getAllPurchases,
);

// 8. Revoke access (admin only)
router.patch(
  "/:id/revoke",
  restrictTo("admin"),
  validate(revokeAccessValidation),
  PurchaseController.revokeAccess,
);

// 9. Restore access (admin only)
router.patch(
  "/:id/restore",
  restrictTo("admin"),
  validate(revokeAccessValidation),
  PurchaseController.restoreAccess,
);

export const PurchaseRoutes = router;