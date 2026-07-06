import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import InvoiceService from "./invoice.service.js";
import ApiError from "../../utils/ApiError.js";
import { Readable } from "stream";

/**
 * Get my invoices (user)
 * GET /api/invoices/my-invoices
 */
const getMyInvoices = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await InvoiceService.getUserInvoices(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoices retrieved successfully",
    data: result.invoices,
    meta: result.pagination,
  });
});

/**
 * Get invoice by ID (user)
 * GET /api/invoices/:invoiceId
 */
const getInvoiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check ownership
  const isAdmin = req.user.role === "admin";
  const isOwner = await InvoiceService.isInvoiceOwner(id, req.user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to view this invoice");
  }

  const result = await InvoiceService.getInvoiceById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

/**
 * Get invoice by invoice number (user)
 * GET /api/invoices/by-number/:invoiceNumber
 */
const getInvoiceByNumber = catchAsync(async (req, res) => {
  const { invoiceNumber } = req.params;
  const result = await InvoiceService.getInvoiceByNumber(invoiceNumber);

  // Check ownership
  const isAdmin = req.user.role === "admin";
  const isOwner = await InvoiceService.isInvoiceOwner(result.invoice._id, req.user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to view this invoice");
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

/**
 * Download invoice PDF
 * GET /api/invoices/:invoiceId/download
 */
const downloadInvoicePDF = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const isAdmin = req.user.role === "admin";
  const isOwner = await InvoiceService.isInvoiceOwner(id, req.user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to download this invoice");
  }

  const result = await InvoiceService.getInvoiceById(id);
  const invoice = result.invoice;

  if (!invoice.pdfUrl) {
    // Regenerate PDF if not exists
    await InvoiceService.regeneratePDF(id);
    const updatedResult = await InvoiceService.getInvoiceById(id);
    if (!updatedResult.invoice.pdfUrl) {
      throw new ApiError(500, "Failed to generate invoice PDF");
    }
    return res.redirect(updatedResult.invoice.pdfUrl);
  }

  // Redirect to Cloudinary URL or stream the file
  res.redirect(invoice.pdfUrl);
});

/**
 * Admin: Get all invoices
 * GET /api/admin/invoices
 */
const adminGetAllInvoices = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await InvoiceService.getAllInvoices(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoices retrieved successfully",
    data: result.invoices,
    meta: result.pagination,
  });
});

/**
 * Admin: Get invoice by ID
 * GET /api/admin/invoices/:invoiceId
 */
const adminGetInvoiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvoiceService.getInvoiceById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

/**
 * Admin: Regenerate invoice PDF
 * POST /api/admin/invoices/:invoiceId/regenerate-pdf
 */
const adminRegeneratePDF = catchAsync(async (req, res) => {
  const { id } = req.params;
  const invoice = await InvoiceService.regeneratePDF(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Invoice PDF regenerated successfully",
    data: invoice,
  });
});

export const InvoiceController = {
  getMyInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  downloadInvoicePDF,
  adminGetAllInvoices,
  adminGetInvoiceById,
  adminRegeneratePDF,
};