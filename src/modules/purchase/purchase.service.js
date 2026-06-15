import mongoose from "mongoose";
import { Purchase } from "./purchase.model.js";
import ApiError from "../../utils/ApiError.js";

class PurchaseServiceClass {
  // Create purchase after successful payment
  async createPurchase(userId, bookId, orderId) {
    // Check if already purchased
    const existingPurchase = await Purchase.findOne({ userId, bookId });
    if (existingPurchase) {
      throw new ApiError(400, "You have already purchased this book");
    }

    const purchase = await Purchase.create({
      userId,
      bookId,
      orderId,
      purchasedAt: new Date(),
      accessStatus: "ACTIVE",
    });

    return purchase;
  }

  // Create multiple purchases for an order
  async createPurchasesForOrder(userId, orderId, bookIds) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const purchases = [];

      for (const bookId of bookIds) {
        // Check if already purchased
        const existing = await Purchase.findOne({ userId, bookId }).session(session);
        if (existing) {
          throw new ApiError(400, `Book ${bookId} already purchased`);
        }

        const purchase = await Purchase.create(
          [
            {
              userId,
              bookId,
              orderId,
              purchasedAt: new Date(),
              accessStatus: "ACTIVE",
            },
          ],
          { session }
        );
        purchases.push(purchase[0]);
      }

      await session.commitTransaction();
      session.endSession();

      return purchases;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * NEW: Create purchase after successful payment (for Stripe webhook)
   * This will be called automatically when payment succeeds
   */
  async createPurchaseAfterPayment(orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Dynamic import to avoid circular dependency
      const { default: Order } = await import("../order/order.model.js");
      const { default: OrderItem } = await import("../order/orderItem.model.js");

      // Get order with items
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      if (order.paymentStatus !== "PAID") {
        throw new ApiError(400, "Order payment not completed");
      }

      const orderItems = await OrderItem.find({ orderId }).session(session);
      
      if (orderItems.length === 0) {
        throw new ApiError(400, "No items found in order");
      }

      // Create purchases for each item
      const purchases = [];
      for (const item of orderItems) {
        // Check if already purchased
        const existingPurchase = await Purchase.findOne({
          userId: order.userId,
          bookId: item.bookId,
        }).session(session);

        if (!existingPurchase) {
          const purchase = await Purchase.create(
            [
              {
                userId: order.userId,
                bookId: item.bookId,
                orderId: order._id,
                purchasedAt: new Date(),
                accessStatus: "ACTIVE",
              },
            ],
            { session }
          );
          purchases.push(purchase[0]);
        }
      }

      // Update order status to COMPLETED
      order.orderStatus = "COMPLETED";
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Created ${purchases.length} purchases`,
        purchases,
        order,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * NEW: Get purchase with full book details (for frontend "My Books" page)
   * Single purchase lookup with book enrichment
   */
  async getPurchaseWithBookDetails(purchaseId) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }

    const { default: Book } = await import("../book/book.model.js");
    const book = await Book.findById(purchase.bookId).select("-pdfFile -pdfFilePublicId");

    return {
      ...purchase.toObject(),
      bookDetails: book,
    };
  }

  /**
   * NEW: Get user purchases with book details (N+1 query optimized)
   * This prevents multiple database queries for better performance
   */
  async getUserPurchasesWithBooks(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "purchasedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { userId, accessStatus: "ACTIVE" };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Purchase.countDocuments(filter),
    ]);

    if (purchases.length === 0) {
      return {
        purchases: [],
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    // Get all book IDs in one array
    const bookIds = [...new Set(purchases.map(p => p.bookId))];
    
    // Fetch all books in one query (prevents N+1 problem)
    const { default: Book } = await import("../book/book.model.js");
    const books = await Book.find({
      _id: { $in: bookIds },
    }).select("-pdfFile -pdfFilePublicId");

    // Create a map for O(1) lookup
    const bookMap = new Map();
    books.forEach(book => {
      bookMap.set(book._id.toString(), book);
    });

    // Enrich purchases with book details
    const enrichedPurchases = purchases.map(purchase => ({
      ...purchase.toObject(),
      book: bookMap.get(purchase.bookId) || null,
    }));

    return {
      purchases: enrichedPurchases,
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

  // Check if user has purchased a specific book
  async hasPurchasedBook(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    return !!purchase;
  }

  // Get purchase by ID
  async getPurchaseById(purchaseId) {
    const purchase = await Purchase.findById(purchaseId).populate("orderId");
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }
    return purchase;
  }

  // Get all purchases for a user (without book details)
  async getUserPurchases(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "purchasedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { userId, accessStatus: "ACTIVE" };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Purchase.countDocuments(filter),
    ]);

    return {
      purchases,
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

  // Get purchase by user and book
  async getPurchaseByBook(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    return purchase;
  }

  // Get all purchases (admin)
  async getAllPurchases(query = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      bookId,
      accessStatus,
      sortBy = "purchasedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (userId) filter.userId = userId;
    if (bookId) filter.bookId = bookId;
    if (accessStatus) filter.accessStatus = accessStatus;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter).sort(sort).skip(skip).limit(limitNumber).populate("orderId"),
      Purchase.countDocuments(filter),
    ]);

    return {
      purchases,
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

  // Revoke access (admin)
  async revokeAccess(purchaseId) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }

    if (purchase.accessStatus === "REVOKED") {
      throw new ApiError(400, "Access already revoked");
    }

    purchase.accessStatus = "REVOKED";
    await purchase.save();

    return purchase;
  }

  // Restore access (admin)
  async restoreAccess(purchaseId) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }

    if (purchase.accessStatus === "ACTIVE") {
      throw new ApiError(400, "Access already active");
    }

    purchase.accessStatus = "ACTIVE";
    await purchase.save();

    return purchase;
  }
}

const PurchaseService = new PurchaseServiceClass();
export default PurchaseService;