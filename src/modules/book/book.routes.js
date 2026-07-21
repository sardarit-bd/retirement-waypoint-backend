import express from "express";
import { BookController } from "./book.controller.js";
import {
  createBookValidation,
  updateBookValidation,
  getBooksValidation,
  getBookByIdValidation,
  publishBookValidation,
  archiveBookValidation,
  deleteBookValidation,
  publicGetBooksValidation,
  publicGetBookBySlugValidation,
  publicGetBookPreviewValidation,
  validate,
} from "./book.validation.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";
import {
  bookFilesUpload,
  uploadMultiple,
} from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// ==================== ADMIN ROUTES ====================
router.use(protect, restrictTo("admin"));

// Create book (with file uploads)
// router.post(
//   "/",
//   uploadMultiple("files", 2),
//   validate(createBookValidation),
//   BookController.createBook
// );

router.post(
  "/",
  bookFilesUpload,
  validate(createBookValidation),
  BookController.createBook,
);

// Get all books (admin)
router.get("/", validate(getBooksValidation), BookController.getAllBooks);

// Get book by ID (admin)
router.get("/:id", validate(getBookByIdValidation), BookController.getBookById);

// Update book
router.patch(
  "/:id",
  bookFilesUpload,
  validate(updateBookValidation),
  BookController.updateBook,
);

// Publish book
router.patch(
  "/:id/publish",
  validate(publishBookValidation),
  BookController.publishBook,
);

// Archive book
router.patch(
  "/:id/archive",
  validate(archiveBookValidation),
  BookController.archiveBook,
);

// Soft delete book
router.delete(
  "/:id",
  validate(deleteBookValidation),
  BookController.deleteBook,
);

// ==================== PUBLIC ROUTES ====================
const publicRouter = express.Router();

// Get public books (published only)
publicRouter.get(
  "/",
  validate(publicGetBooksValidation),
  BookController.getPublicBooks,
);

// Get featured books
publicRouter.get("/featured", BookController.getFeaturedBooks);

// Get page-limited preview PDF for a book (published only)
publicRouter.get(
  "/:slug/preview",
  validate(publicGetBookPreviewValidation),
  BookController.getBookPreview,
);

// Get book by slug (published only)
publicRouter.get(
  "/:slug",
  validate(publicGetBookBySlugValidation),
  BookController.getPublicBookBySlug,
);

export const BookRoutes = router;
export const PublicBookRoutes = publicRouter;