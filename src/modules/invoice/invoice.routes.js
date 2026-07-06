import express from "express";
import { InvoiceController } from "./invoice.controller.js";
import {
  getMyInvoicesValidation,
  getInvoiceByIdValidation,
  getInvoiceByNumberValidation,
  adminGetInvoicesValidation,
  validate,
} from "./invoice.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";

const router = express.Router();

// ==================== USER ROUTES ====================
router.use(protect);

// Get my invoices
router.get(
  "/my-invoices",
  validate(getMyInvoicesValidation),
  InvoiceController.getMyInvoices
);

// Get invoice by ID
router.get(
  "/:id",
  validate(getInvoiceByIdValidation),
  InvoiceController.getInvoiceById
);

// Get invoice by invoice number
router.get(
  "/by-number/:invoiceNumber",
  validate(getInvoiceByNumberValidation),
  InvoiceController.getInvoiceByNumber
);

// Download invoice PDF
router.get(
  "/:id/download",
  validate(getInvoiceByIdValidation),
  InvoiceController.downloadInvoicePDF
);

// ==================== ADMIN ROUTES ====================

// Get all invoices (admin)
router.get(
  "/admin/invoices",
  restrictTo("admin"),
  validate(adminGetInvoicesValidation),
  InvoiceController.adminGetAllInvoices
);

// Get invoice by ID (admin)
router.get(
  "/admin/invoices/:id",
  restrictTo("admin"),
  validate(getInvoiceByIdValidation),
  InvoiceController.adminGetInvoiceById
);

// Regenerate PDF (admin)
router.post(
  "/admin/invoices/:id/regenerate-pdf",
  restrictTo("admin"),
  validate(getInvoiceByIdValidation),
  InvoiceController.adminRegeneratePDF
);

export const InvoiceRoutes = router;