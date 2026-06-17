import express from "express";
import {
  getMyBooksValidation,
  getMyBookByIdValidation,
  downloadBookValidation,
  getDownloadLogsValidation,
  getDownloadStatsValidation,
  validate,
} from "./myBooks.validation.js";
import { MyBooksController } from "./myBooks.controller.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== USER ROUTES ====================

// Get my purchased books
router.get(
  "/",
  validate(getMyBooksValidation),
  MyBooksController.getMyBooks
);

// Get single book by ID
router.get(
  "/:bookId",
  validate(getMyBookByIdValidation),
  MyBooksController.getMyBookById
);

// Download book
router.get(
  "/:bookId/download",
  validate(downloadBookValidation),
  MyBooksController.downloadBook
);

// ==================== ADMIN ROUTES ====================

// Get download logs
router.get(
  "/admin/download-logs",
  restrictTo("admin"),
  validate(getDownloadLogsValidation),
  MyBooksController.adminGetDownloadLogs
);

// Get download statistics
router.get(
  "/admin/download-stats",
  restrictTo("admin"),
  validate(getDownloadStatsValidation),
  MyBooksController.adminGetDownloadStats
);

export const MyBooksRoutes = router;