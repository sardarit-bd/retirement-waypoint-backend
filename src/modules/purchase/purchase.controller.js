import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import PurchaseService from "./purchase.service.js";
import ApiError from "../../utils/ApiError.js";

const getMyPurchases = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await PurchaseService.getUserPurchases(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchases retrieved successfully",
    data: result.purchases,
    meta: result.pagination,
  });
});

const checkPurchaseByBook = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const hasPurchased = await PurchaseService.hasPurchasedBook(
    req.user.id,
    bookId,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchase status retrieved",
    data: { hasPurchased, bookId },
  });
});

const getPurchaseByBook = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  const purchase = await PurchaseService.getPurchaseByBook(req.user.id, bookId);

  if (!purchase) {
    throw new ApiError(404, "Purchase not found for this book");
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchase retrieved successfully",
    data: purchase,
  });
});

const getPurchaseById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const purchase = await PurchaseService.getPurchaseById(id);

  // Check if user is admin or purchase owner
  const isAdmin = req.user.role === "admin";
  const isOwner = purchase.userId === req.user.id;

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to view this purchase");
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchase retrieved successfully",
    data: purchase,
  });
});

const getAllPurchases = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await PurchaseService.getAllPurchases(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchases retrieved successfully",
    data: result.purchases,
    meta: result.pagination,
  });
});

/**
 * NEW: Get user purchases with full book details
 */
const getMyPurchasesWithDetails = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await PurchaseService.getUserPurchasesWithBooks(
    req.user.id,
    query,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchases retrieved successfully",
    data: result.purchases,
    meta: result.pagination,
  });
});

/**
 * NEW: Get single purchase with book details
 */
const getPurchaseWithBookDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const purchase = await PurchaseService.getPurchaseWithBookDetails(id);

  // Check if user is admin or purchase owner
  const isAdmin = req.user.role === "admin";
  const isOwner = purchase.userId === req.user.id;

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to view this purchase");
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Purchase retrieved successfully",
    data: purchase,
  });
});

const revokeAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const purchase = await PurchaseService.revokeAccess(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Access revoked successfully",
    data: purchase,
  });
});

const restoreAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const purchase = await PurchaseService.restoreAccess(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Access restored successfully",
    data: purchase,
  });
});

export const PurchaseController = {
  getMyPurchases,
  getMyPurchasesWithDetails,
  getPurchaseWithBookDetails,
  checkPurchaseByBook,
  getPurchaseByBook,
  getPurchaseById,
  getAllPurchases,
  revokeAccess,
  restoreAccess,
};
