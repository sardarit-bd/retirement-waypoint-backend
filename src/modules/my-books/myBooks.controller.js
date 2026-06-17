
// import catchAsync from "../utils/catchAsync.js";
// import sendResponse from "../utils/sendResponse.js";
// import MyBooksService from "./myBooks.service.js";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import MyBooksService from "../my-books/myBooks.service.js";

/**
 * Get my purchased books
 * GET /api/my-books
 */
const getMyBooks = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await MyBooksService.getUserBooks(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My books retrieved successfully",
    data: result.books,
    meta: result.pagination,
  });
});

/**
 * Get single purchased book by ID
 * GET /api/my-books/:bookId
 */
const getMyBookById = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const book = await MyBooksService.getUserBookById(req.user.id, bookId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book retrieved successfully",
    data: book,
  });
});

/**
 * Download book
 * GET /api/my-books/:bookId/download
 */
const downloadBook = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const result = await MyBooksService.generateSecureDownloadUrl(
    req.user.id,
    bookId,
    ipAddress,
    userAgent
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Download URL generated successfully",
    data: result,
  });
});

/**
 * Admin: Get download logs
 * GET /api/admin/download-logs
 */
const adminGetDownloadLogs = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await MyBooksService.getDownloadLogs(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Download logs retrieved successfully",
    data: result.logs,
    meta: result.pagination,
  });
});

/**
 * Admin: Get download statistics
 * GET /api/admin/download-stats
 */
const adminGetDownloadStats = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const stats = await MyBooksService.getDownloadStats(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Download statistics retrieved successfully",
    data: stats,
  });
});

// Export ownership verification helper for future modules
export const hasPurchasedBook = MyBooksService.hasPurchasedBook.bind(MyBooksService);

export const MyBooksController = {
  getMyBooks,
  getMyBookById,
  downloadBook,
  adminGetDownloadLogs,
  adminGetDownloadStats,
  hasPurchasedBook, // For Review Module later
};