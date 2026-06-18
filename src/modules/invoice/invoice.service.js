import mongoose from "mongoose";
import { Invoice } from "./invoice.model.js";
import { Order } from "../order/order.model.js";
import { OrderItem } from "../order/orderItem.model.js";
import { Book } from "../book/book.model.js";
import ApiError from "../../utils/ApiError.js";
import { generateInvoicePDF } from "./invoice.pdf.js";
import UploadService from "../upload/upload.service.js";

class InvoiceServiceClass {
  /**
   * Generate unique invoice number
   * Format: INV-YYYYMMDD-000001
   */
  async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    // Find last invoice with same date prefix
    const lastInvoice = await Invoice.findOne({
      invoiceNumber: { $regex: `^INV-${datePrefix}-` },
    }).sort({ invoiceNumber: -1 });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    const sequenceStr = String(sequence).padStart(6, "0");
    return `INV-${datePrefix}-${sequenceStr}`;
  }

  /**
   * Create invoice after successful payment
   */
  async createInvoice(orderId) {
    // Check if invoice already exists (idempotency)
    const existingInvoice = await Invoice.findOne({ orderId });
    if (existingInvoice) {
      console.log(`⚠️ Invoice already exists for order ${orderId}`);
      return existingInvoice;
    }

    // Get order with items
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.paymentStatus !== "PAID") {
      throw new ApiError(400, "Cannot create invoice for unpaid order");
    }

    const orderItems = await OrderItem.find({ orderId: order._id });
    if (orderItems.length === 0) {
      throw new ApiError(400, "No items found in order");
    }

    // Get book details for each item
    const bookIds = orderItems.map((item) => item.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    });

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
      orderId: order._id,
      userId: order.userId,
      invoiceNumber,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      currency: "USD",
      status: "PAID",
      issuedAt: new Date(),
    });

    // Generate PDF
    try {
      const pdfBuffer = await generateInvoicePDF(invoice, order, orderItems, bookMap);
      
      // Upload PDF to Cloudinary
      const pdfUpload = await UploadService.uploadFile(pdfBuffer, {
        folder: "retirement-waypoint/invoices",
        resource_type: "raw",
        public_id: `invoice-${invoiceNumber}`,
      });

      invoice.pdfUrl = pdfUpload.url;
      invoice.pdfPublicId = pdfUpload.publicId;
      await invoice.save();

      console.log(`✅ Invoice ${invoiceNumber} created with PDF`);
    } catch (error) {
      console.error(`❌ Failed to generate PDF for invoice ${invoiceNumber}:`, error.message);
      // Invoice created without PDF - can be regenerated later
    }

    return invoice;
  }

  /**
   * Get invoice by ID with full details
   */
  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    const order = await Order.findById(invoice.orderId);
    const orderItems = await OrderItem.find({ orderId: invoice.orderId });

    // Get book details
    const bookIds = orderItems.map((item) => item.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    });

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    return {
      invoice: invoice.toObject(),
      order: order?.toObject() || null,
      items: orderItems.map((item) => ({
        ...item.toObject(),
        book: bookMap.get(item.bookId) || null,
      })),
    };
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber) {
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }
    return this.getInvoiceById(invoice._id);
  }

  /**
   * Get user invoices
   */
  async getUserInvoices(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = "issuedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { userId };
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Invoice.countDocuments(filter),
    ]);

    // Get order details for each invoice
    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const order = await Order.findById(invoice.orderId);
        const orderItems = await OrderItem.find({ orderId: invoice.orderId });
        return {
          ...invoice.toObject(),
          order: order?.toObject() || null,
          items: orderItems,
          itemCount: orderItems.length,
        };
      })
    );

    return {
      invoices: invoicesWithDetails,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  /**
   * Get all invoices (admin)
   */
  async getAllInvoices(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = "issuedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (status) filter.status = status;

    // Search by invoice number or order number
    if (search && search.trim()) {
      filter.$or = [
        { invoiceNumber: { $regex: search.trim(), $options: "i" } },
      ];
      // Also search by order number (requires separate query)
      const orders = await Order.find({
        orderNumber: { $regex: search.trim(), $options: "i" },
      }).select("_id");
      const orderIds = orders.map((o) => o._id);
      if (orderIds.length > 0) {
        filter.$or.push({ orderId: { $in: orderIds } });
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate("orderId"),
      Invoice.countDocuments(filter),
    ]);

    // Get order items for each invoice
    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const orderItems = await OrderItem.find({ orderId: invoice.orderId._id });
        return {
          ...invoice.toObject(),
          order: invoice.orderId,
          items: orderItems,
          itemCount: orderItems.length,
        };
      })
    );

    return {
      invoices: invoicesWithDetails,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  /**
   * Check if user owns invoice
   */
  async isInvoiceOwner(invoiceId, userId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId });
    return !!invoice;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId, status) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    invoice.status = status;
    await invoice.save();

    return invoice;
  }

  /**
   * Regenerate PDF for invoice
   */
  async regeneratePDF(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    const order = await Order.findById(invoice.orderId);
    const orderItems = await OrderItem.find({ orderId: invoice.orderId });

    const bookIds = orderItems.map((item) => item.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    });

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    // Delete old PDF if exists
    if (invoice.pdfPublicId) {
      await UploadService.deleteFile(invoice.pdfPublicId);
    }

    // Generate new PDF
    const pdfBuffer = await generateInvoicePDF(invoice, order, orderItems, bookMap);
    
    // Upload new PDF
    const pdfUpload = await UploadService.uploadFile(pdfBuffer, {
      folder: "retirement-waypoint/invoices",
      resource_type: "raw",
      public_id: `invoice-${invoice.invoiceNumber}`,
    });

    invoice.pdfUrl = pdfUpload.url;
    invoice.pdfPublicId = pdfUpload.publicId;
    await invoice.save();

    return invoice;
  }
}

const InvoiceService = new InvoiceServiceClass();
export default InvoiceService;