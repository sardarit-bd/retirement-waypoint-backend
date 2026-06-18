import mongoose from "mongoose";
import { RefundRequest } from "./refundRequest.model.js";
import { RefundLog } from "./refundLog.model.js";
import { Order } from "../order/order.model.js";
import { Purchase } from "../purchase/purchase.model.js";
import { Invoice } from "../invoice/invoice.model.js";
import { Review } from "../review/review.model.js";
import stripe from "../../config/stripe.js";
import ApiError from "../../utils/ApiError.js";

class RefundServiceClass {
  /**
   * Create refund log entry
   */
  async createRefundLog(refundRequestId, action, performedBy, notes = null, metadata = null) {
    return RefundLog.create({
      refundRequestId,
      action,
      performedBy,
      notes,
      metadata,
    });
  }

  /**
   * Check if user has active refund request for an order
   */
  async hasActiveRefundRequest(orderId) {
    const existing = await RefundRequest.findOne({
      orderId,
      status: { $in: ["PENDING", "APPROVED"] },
    });
    return !!existing;
  }

  /**
   * Check if order has been refunded
   */
  async isOrderRefunded(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return false;
    return order.paymentStatus === "REFUNDED" || order.orderStatus === "REFUNDED";
  }

  /**
   * Create refund request (user)
   */
  async createRefundRequest(userId, requestData) {
    const { orderId, reason, details } = requestData;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new ApiError(403, "You don't have permission to request refund for this order");
    }

    // Verify order is paid
    if (order.paymentStatus !== "PAID") {
      throw new ApiError(400, "Refund can only be requested for paid orders");
    }

    // Verify order is not already refunded
    if (await this.isOrderRefunded(orderId)) {
      throw new ApiError(400, "This order has already been refunded");
    }

    // Check if refund request already exists
    if (await this.hasActiveRefundRequest(orderId)) {
      throw new ApiError(400, "A refund request is already in progress for this order");
    }

    // Get purchase for this order
    const purchase = await Purchase.findOne({ orderId, accessStatus: "ACTIVE" });
    if (!purchase) {
      throw new ApiError(404, "Purchase not found for this order");
    }

    // Create refund request
    const refundRequest = await RefundRequest.create({
      userId,
      orderId,
      purchaseId: purchase._id,
      reason,
      details: details || null,
      refundAmount: order.totalAmount,
      status: "PENDING",
      requestedAt: new Date(),
    });

    // Create log
    await this.createRefundLog(
      refundRequest._id,
      "REQUESTED",
      userId,
      `Refund requested for order ${order.orderNumber}`,
      { reason, details }
    );

    return refundRequest;
  }

  /**
   * Get user's refund requests
   */
  async getUserRefunds(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = "requestedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { userId };
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [refunds, total] = await Promise.all([
      RefundRequest.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate("orderId", "orderNumber totalAmount paymentStatus"),
      RefundRequest.countDocuments(filter),
    ]);

    return {
      refunds,
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
   * Get refund by ID (user)
   */
  async getRefundById(refundId, userId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("orderId", "orderNumber totalAmount paymentStatus orderStatus")
      .populate("purchaseId", "bookId purchasedAt accessStatus");

    if (!refund) {
      throw new ApiError(404, "Refund request not found");
    }

    if (refund.userId !== userId) {
      throw new ApiError(403, "You don't have permission to view this refund");
    }

    // Get logs
    const logs = await RefundLog.find({ refundRequestId: refund._id })
      .sort({ createdAt: -1 });

    return {
      ...refund.toObject(),
      logs,
    };
  }

  /**
   * Admin: Get all refunds
   */
  async adminGetAllRefunds(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = "requestedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (status) filter.status = status;

    // Search by order number or user ID
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { userId: searchRegex },
      ];
      // Search by order number (requires separate query)
      const orders = await Order.find({
        orderNumber: { $regex: searchRegex },
      }).select("_id");
      const orderIds = orders.map((o) => o._id);
      if (orderIds.length > 0) {
        filter.$or.push({ orderId: { $in: orderIds } });
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [refunds, total] = await Promise.all([
      RefundRequest.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate("orderId", "orderNumber totalAmount paymentStatus userId")
        .populate("purchaseId", "bookId purchasedAt accessStatus"),
      RefundRequest.countDocuments(filter),
    ]);

    // Get logs for each refund
    const refundsWithLogs = await Promise.all(
      refunds.map(async (refund) => {
        const logs = await RefundLog.find({ refundRequestId: refund._id })
          .sort({ createdAt: -1 })
          .limit(5);
        return {
          ...refund.toObject(),
          logs,
        };
      })
    );

    return {
      refunds: refundsWithLogs,
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
   * Admin: Get refund by ID
   */
  async adminGetRefundById(refundId) {
    const refund = await RefundRequest.findById(refundId)
      .populate("orderId", "orderNumber totalAmount paymentStatus orderStatus userId")
      .populate("purchaseId", "bookId purchasedAt accessStatus");

    if (!refund) {
      throw new ApiError(404, "Refund request not found");
    }

    const logs = await RefundLog.find({ refundRequestId: refund._id })
      .sort({ createdAt: -1 });

    return {
      ...refund.toObject(),
      logs,
    };
  }

  /**
   * Admin: Approve refund
   */
  async approveRefund(refundId, adminId, adminNotes = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get refund request
      const refund = await RefundRequest.findById(refundId).session(session);
      if (!refund) {
        throw new ApiError(404, "Refund request not found");
      }

      if (refund.status !== "PENDING") {
        throw new ApiError(400, `Cannot approve refund with status: ${refund.status}`);
      }

      // Get order
      const order = await Order.findById(refund.orderId).session(session);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      if (order.paymentStatus !== "PAID") {
        throw new ApiError(400, "Cannot refund order that is not paid");
      }

      if (order.paymentStatus === "REFUNDED") {
        throw new ApiError(400, "Order has already been refunded");
      }

      // Process Stripe refund
      let stripeRefund;
      try {
        stripeRefund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: Math.round(refund.refundAmount * 100),
        });
      } catch (error) {
        throw new ApiError(500, `Stripe refund failed: ${error.message}`);
      }

      // Update refund request
      refund.status = "COMPLETED";
      refund.approvedBy = adminId;
      refund.approvedAt = new Date();
      refund.adminNotes = adminNotes || null;
      refund.stripeRefundId = stripeRefund.id;
      await refund.save({ session });

      // Update order
      order.paymentStatus = "REFUNDED";
      order.orderStatus = "REFUNDED";
      await order.save({ session });

      // Update invoice
      const invoice = await Invoice.findOne({ orderId: order._id }).session(session);
      if (invoice) {
        invoice.status = "REFUNDED";
        await invoice.save({ session });
      }

      // Revoke purchase access
      const purchase = await Purchase.findById(refund.purchaseId).session(session);
      if (purchase) {
        purchase.accessStatus = "REVOKED";
        await purchase.save({ session });
      }

      // Delete reviews for this book
      await Review.deleteMany({
        userId: refund.userId,
        bookId: purchase?.bookId,
      }).session(session);

      // Create log
      await this.createRefundLog(
        refund._id,
        "COMPLETED",
        adminId,
        adminNotes || "Refund approved and processed",
        { stripeRefundId: stripeRefund.id, refundAmount: refund.refundAmount }
      );

      await session.commitTransaction();

      return refund;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin: Reject refund
   */
  async rejectRefund(refundId, adminId, adminNotes) {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) {
      throw new ApiError(404, "Refund request not found");
    }

    if (refund.status !== "PENDING") {
      throw new ApiError(400, `Cannot reject refund with status: ${refund.status}`);
    }

    refund.status = "REJECTED";
    refund.rejectedAt = new Date();
    refund.adminNotes = adminNotes;
    await refund.save();

    // Create log
    await this.createRefundLog(
      refund._id,
      "REJECTED",
      adminId,
      adminNotes,
      { rejectedAt: new Date() }
    );

    return refund;
  }

  /**
   * Check if user has purchased a book (for review module)
   */
  async hasPurchasedBook(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    return !!purchase;
  }
}

const RefundService = new RefundServiceClass();
export default RefundService;