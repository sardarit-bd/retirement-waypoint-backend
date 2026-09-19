import mongoose from "mongoose";
import { Readable } from "stream";
import { Order } from "./order.model.js";
import { OrderItem } from "./orderItem.model.js";
import ApiError from "../../utils/ApiError.js";
import { Book } from "../book/book.model.js";
import { Purchase } from "../purchase/purchase.model.js";
import { Invoice } from "../invoice/invoice.model.js";
import CouponService from "../coupon/coupon.service.js";
import AuthService from "../auth/auth.service.js";
import cloudinary from "../../config/cloudinary.js";
import { DownloadLog } from "../download/downloadLog.model.js";

class OrderServiceClass {
  // Create order with items
  async createOrder(userId, orderData) {
    const { items: clientItems, notes, guestName, guestEmail } = orderData;
    const isGuest = !userId;

    if (isGuest && !guestEmail) {
      throw new ApiError(400, "Guest email is required for checkout");
    }

    if (!clientItems || clientItems.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    const bookIds = clientItems.map((item) => item.bookId);

    // ==========================
    // CHECK ALREADY PURCHASED (Logged-in users)
    // ==========================
    if (userId) {
      const existingPurchases = await Purchase.find({
        userId,
        bookId: { $in: bookIds },
        accessStatus: "ACTIVE",
      });

      if (existingPurchases.length > 0) {
        const purchasedBookIds = existingPurchases.map(
          (purchase) => purchase.bookId,
        );

        throw new ApiError(
          400,
          `You have already purchased these books: ${purchasedBookIds.join(", ")}`,
        );
      }
    }

    // ==========================
    // FETCH BOOKS
    // ==========================
    const books = await Book.find({
      _id: { $in: bookIds },
      status: "PUBLISHED",
      deletedAt: null,
    });

    if (books.length !== clientItems.length) {
      throw new ApiError(400, "One or more books are invalid or unavailable");
    }

    // ==========================
    // CREATE BOOK MAP
    // ==========================
    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(book._id.toString(), {
        title: book.title,
        authorName: book.authorName,
        price: book.price,
        coverImage: book.coverImage,
      });
    });

    // ==========================
    // BUILD ORDER ITEMS
    // ==========================
    const orderItems = clientItems.map((item) => {
      const bookData = bookMap.get(item.bookId);

      if (!bookData) {
        throw new ApiError(400, `Book ${item.bookId} not found or unavailable`);
      }

      return {
        bookId: item.bookId,
        bookTitle: bookData.title,
        authorName: bookData.authorName,
        bookPrice: bookData.price,
        bookCoverImage: bookData.coverImage,
      };
    });

    // ==========================
    // CALCULATE TOTAL
    // ==========================
    const subtotal = orderItems.reduce((sum, item) => sum + item.bookPrice, 0);

    const totalAmount = subtotal;

    // ==========================
    // TRANSACTION
    // ==========================
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const order = await Order.create(
        [
          {
            userId: userId || null,
            guestName: isGuest ? guestName || null : null,
            guestEmail: isGuest ? guestEmail : null,
            isGuest,
            subtotal,
            totalAmount,
            notes: notes || null,
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
          },
        ],
        { session },
      );

      const orderItemsWithOrderId = orderItems.map((item) => ({
        ...item,
        orderId: order[0]._id,
      }));

      await OrderItem.create(orderItemsWithOrderId, {
        session,
      });

      await session.commitTransaction();

      return await this.getOrderById(order[0]._id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Get order by ID with items
  async getOrderById(orderId) {
    console.log("ORDER ID =", orderId);
    console.log("TYPE =", typeof orderId);

    const order = await Order.findById(orderId);

    console.log("FOUND ORDER =", order);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Fetch order items
    const items = await OrderItem.find({ orderId: order._id });

    // Fetch user from Better Auth if registered
    const user = order.userId ? await AuthService.getAuthUserById(order.userId) : null;

    return {
      ...order.toObject(),
      items,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        : order.isGuest
          ? {
              id: null,
              name: order.guestName,
              email: order.guestEmail,
              image: null,
            }
          : null,
    };
  }

  // Get user orders
  async getUserOrders(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { userId };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Order.countDocuments(filter),
    ]);

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ orderId: order._id });
        return {
          ...order.toObject(),
          items,
        };
      }),
    );

    return {
      orders: ordersWithItems,
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

  // Get all orders (admin) with filters
  async getAllOrders(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      paymentStatus,
      orderStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderStatus) filter.orderStatus = orderStatus;

    if (search && search.trim()) {
      filter.orderNumber = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Order.countDocuments(filter),
    ]);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Order Items
        const items = await OrderItem.find({
          orderId: order._id,
        });

        // Better Auth User
        const user = await AuthService.getAuthUserById(order.userId);

        return {
          ...order.toObject(),
          items,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }),
    );

    return {
      orders: ordersWithItems,
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

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus, stripeData = {}) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updateData = { paymentStatus };
    if (stripeData.stripeSessionId)
      updateData.stripeSessionId = stripeData.stripeSessionId;
    if (stripeData.stripePaymentIntentId)
      updateData.stripePaymentIntentId = stripeData.stripePaymentIntentId;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return updatedOrder;
  }

  // Update order status
  async updateOrderStatus(orderId, orderStatus) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus } },
      { new: true, runValidators: true },
    );

    return updatedOrder;
  }

  // Check if user owns order
  async isOrderOwner(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, userId });
    return !!order;
  }

  /**
   * Apply coupon to order
   */
  async applyCouponToOrder(userId, orderData) {
    const { items: clientItems, notes, couponCode, guestName, guestEmail } = orderData;
    const isGuest = !userId;

    if (isGuest && !guestEmail) {
      throw new ApiError(400, "Guest email is required for checkout");
    }

    if (!clientItems || clientItems.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    const bookIds = clientItems.map((item) => item.bookId);

    // Check already purchased (for logged-in users)
    if (userId) {
      const existingPurchases = await Purchase.find({
        userId,
        bookId: { $in: bookIds },
        accessStatus: "ACTIVE",
      });

      if (existingPurchases.length > 0) {
        const purchasedBookIds = existingPurchases.map((p) => p.bookId);
        throw new ApiError(
          400,
          `You have already purchased these books: ${purchasedBookIds.join(", ")}`,
        );
      }
    }

    // Fetch books
    const books = await Book.find({
      _id: { $in: bookIds },
      status: "PUBLISHED",
      deletedAt: null,
    });

    if (books.length !== clientItems.length) {
      throw new ApiError(400, "One or more books are invalid or unavailable");
    }

    // Create book map
    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), {
        title: book.title,
        authorName: book.authorName,
        price: book.price,
        coverImage: book.coverImage,
      });
    });

    // Build order items
    const orderItems = clientItems.map((item) => {
      const bookData = bookMap.get(item.bookId);
      if (!bookData) {
        throw new ApiError(400, `Book ${item.bookId} not found or unavailable`);
      }
      return {
        bookId: item.bookId,
        bookTitle: bookData.title,
        bookPrice: bookData.price,
        bookCoverImage: bookData.coverImage,
      };
    });

    // Calculate subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + item.bookPrice, 0);

    // Validate coupon if provided
    let discountAmount = 0;
    let couponId = null;
    let finalCouponCode = null;

    if (couponCode) {
      // ✅ Using static import - NO dynamic import
      const result = await CouponService.validateCoupon(
        couponCode,
        userId,
        subtotal,
      );

      discountAmount = result.discountAmount;
      couponId = result.coupon._id;
      finalCouponCode = result.coupon.code;
    }

    const totalAmount = subtotal - discountAmount;

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create order
      const order = await Order.create(
        [
          {
            userId: userId || null,
            guestName: isGuest ? guestName || null : null,
            guestEmail: isGuest ? guestEmail : null,
            isGuest,
            couponId,
            couponCode: finalCouponCode,
            discountAmount,
            subtotal,
            totalAmount,
            notes: notes || null,
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
          },
        ],
        { session },
      );

      // Create order items
      const orderItemsWithOrderId = orderItems.map((item) => ({
        ...item,
        orderId: order[0]._id,
      }));

      await OrderItem.create(orderItemsWithOrderId, { session });

      await session.commitTransaction();

      return await this.getOrderById(order[0]._id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Record coupon usage after successful payment
   */
  async recordCouponUsageAfterPayment(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!order.couponId || order.discountAmount === 0) {
      return null; // No coupon used
    }

    return CouponService.recordCouponUsage(
      orderId,
      userId,
      order.couponId,
      order.discountAmount,
    );
  }

  /**
   * Stream book PDF directly to client response
   */
  async streamPdfByToken(token, query = {}, clientInfo = {}, res) {
    if (!token) {
      throw new ApiError(400, "Download token is required");
    }

    const order = await Order.findOne({
      downloadToken: token,
      paymentStatus: "PAID",
    });

    if (!order) {
      throw new ApiError(404, "Invalid download token or unpaid order");
    }

    if (order.downloadTokenExpiresAt && new Date() > order.downloadTokenExpiresAt) {
      throw new ApiError(410, "Download link has expired. Please contact support.");
    }

    // Get order items
    const orderItems = await OrderItem.find({ orderId: order._id });
    if (!orderItems || orderItems.length === 0) {
      throw new ApiError(404, "No books found in this order");
    }

    // Identify target book
    let targetItem = orderItems[0];
    if (query.bookId) {
      const match = orderItems.find(
        (item) => item.bookId?.toString() === query.bookId?.toString()
      );
      if (match) targetItem = match;
    }

    // Fetch book with PDF file details
    const book = await Book.findById(targetItem.bookId).select("+pdfFile +pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    // Determine upstream source URL: prefer stored direct URL, fallback to Cloudinary signed URL
    let sourceUrl = book.pdfFile;
    if (!sourceUrl && book.pdfFilePublicId) {
      sourceUrl = cloudinary.url(book.pdfFilePublicId, {
        resource_type: "raw",
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
    }

    if (!sourceUrl) {
      throw new ApiError(500, "Book PDF is currently not available for download");
    }

    // Fetch the PDF stream from storage
    const upstreamRes = await fetch(sourceUrl);
    if (!upstreamRes.ok) {
      console.error(`❌ Upstream PDF fetch failed: ${upstreamRes.status} ${upstreamRes.statusText} for URL: ${sourceUrl}`);
      throw new ApiError(502, "Failed to retrieve book file from storage");
    }

    // Increment download count on the order
    await Order.findByIdAndUpdate(order._id, {
      $inc: { downloadCount: 1 },
    });

    // Find purchase reference if one was created
    const purchase = await Purchase.findOne({
      orderId: order._id,
      bookId: targetItem.bookId,
    });

    // Record DownloadLog entry
    await DownloadLog.create({
      userId: order.userId || null,
      guestEmail: order.guestEmail || null,
      orderId: order._id,
      purchaseId: purchase?._id || null,
      bookId: targetItem.bookId,
      ipAddress: clientInfo.ipAddress || null,
      userAgent: clientInfo.userAgent || null,
      downloadedAt: new Date(),
    });

    // Format clean safe filename for download
    const safeTitle = (book.title || book.slug || "retirement-waypoint")
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .replace(/_+/g, "_");
    const fileName = `${safeTitle}.pdf`;

    // Set streaming headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    // Pipe stream directly to Express client response
    Readable.fromWeb(upstreamRes.body).pipe(res);
  }

  /**
   * Download book via secure guest download token (metadata)
   */
  async downloadByToken(token, query = {}, clientInfo = {}) {
    if (!token) {
      throw new ApiError(400, "Download token is required");
    }

    const order = await Order.findOne({
      downloadToken: token,
      paymentStatus: "PAID",
    });

    if (!order) {
      throw new ApiError(404, "Invalid download token or unpaid order");
    }

    if (order.downloadTokenExpiresAt && new Date() > order.downloadTokenExpiresAt) {
      throw new ApiError(410, "Download link has expired. Please contact support.");
    }

    // Get order items
    const orderItems = await OrderItem.find({ orderId: order._id });
    if (!orderItems || orderItems.length === 0) {
      throw new ApiError(404, "No books found in this order");
    }

    // Identify target book
    let targetItem = orderItems[0];
    if (query.bookId) {
      const match = orderItems.find(
        (item) => item.bookId?.toString() === query.bookId?.toString()
      );
      if (match) targetItem = match;
    }

    // Fetch book with raw PDF public ID and direct URL
    const book = await Book.findById(targetItem.bookId).select("+pdfFile +pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    let downloadUrl = book.pdfFile;
    if (!downloadUrl && book.pdfFilePublicId) {
      downloadUrl = cloudinary.url(book.pdfFilePublicId, {
        resource_type: "raw",
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
    }

    if (!downloadUrl) {
      throw new ApiError(500, "Book PDF is currently not available for download");
    }

    // Increment download count on the order
    await Order.findByIdAndUpdate(order._id, {
      $inc: { downloadCount: 1 },
    });

    // Find purchase reference if one was created
    const purchase = await Purchase.findOne({
      orderId: order._id,
      bookId: targetItem.bookId,
    });

    // Record DownloadLog entry
    await DownloadLog.create({
      userId: order.userId || null,
      guestEmail: order.guestEmail || null,
      orderId: order._id,
      purchaseId: purchase?._id || null,
      bookId: targetItem.bookId,
      ipAddress: clientInfo.ipAddress || null,
      userAgent: clientInfo.userAgent || null,
      downloadedAt: new Date(),
    });

    const safeTitle = (book.title || book.slug || "retirement-waypoint")
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .replace(/_+/g, "_");
    const downloadFileName = `${safeTitle}.pdf`;

    return {
      downloadUrl,
      fileName: downloadFileName,
      bookTitle: book.title,
      orderNumber: order.orderNumber,
      orderId: order._id,
      expiresIn: "7 days",
    };
  }

  /**
   * Retroactively claim guest orders, purchases, and invoices for an authenticated user
   * @param {string} userId - Authenticated user's ID
   * @param {string} email - Authenticated user's email
   */
  async claimGuestOrders(userId, email) {
    if (!userId || !email) {
      return { ordersClaimed: 0, purchasesClaimed: 0, invoicesClaimed: 0 };
    }

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const escapedEmail = normalizedEmail.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const emailRegex = new RegExp(`^${escapedEmail}$`, "i");

      // 1. Link guest orders to the newly authenticated userId
      const orderUpdateResult = await Order.updateMany(
        {
          $or: [{ guestEmail: normalizedEmail }, { guestEmail: emailRegex }],
          $or: [
            { userId: null },
            { userId: "" },
            { userId: { $exists: false } },
          ],
        },
        {
          $set: {
            userId: String(userId),
          },
        },
      );

      // 2. Link guest purchases to the userId
      // Check existing user purchases to avoid duplicate key error on { userId: 1, bookId: 1 }
      const existingUserPurchases = await Purchase.find({
        userId: String(userId),
      }).distinct("bookId");

      // Link non-duplicate guest purchases
      const purchaseUpdateResult = await Purchase.updateMany(
        {
          $or: [
            { customerEmail: normalizedEmail },
            { customerEmail: emailRegex },
          ],
          $or: [
            { userId: null },
            { userId: "" },
            { userId: { $exists: false } },
          ],
          bookId: { $nin: existingUserPurchases },
        },
        {
          $set: {
            userId: String(userId),
          },
        },
      );

      // If user already owns the book, remove redundant unlinked guest purchases
      if (existingUserPurchases.length > 0) {
        await Purchase.deleteMany({
          $or: [
            { customerEmail: normalizedEmail },
            { customerEmail: emailRegex },
          ],
          $or: [
            { userId: null },
            { userId: "" },
            { userId: { $exists: false } },
          ],
          bookId: { $in: existingUserPurchases },
        });
      }

      // 3. Link past guest invoices
      const invoiceUpdateResult = await Invoice.updateMany(
        {
          $or: [{ guestEmail: normalizedEmail }, { guestEmail: emailRegex }],
          $or: [
            { userId: null },
            { userId: "" },
            { userId: { $exists: false } },
          ],
        },
        {
          $set: {
            userId: String(userId),
          },
        },
      );

      if (
        orderUpdateResult.modifiedCount > 0 ||
        purchaseUpdateResult.modifiedCount > 0 ||
        invoiceUpdateResult.modifiedCount > 0
      ) {
        console.log(
          `✅ [Guest Order Claiming] Linked to user ${userId} (${normalizedEmail}): ` +
            `${orderUpdateResult.modifiedCount} orders, ` +
            `${purchaseUpdateResult.modifiedCount} purchases, ` +
            `${invoiceUpdateResult.modifiedCount} invoices`,
        );
      }

      return {
        ordersClaimed: orderUpdateResult.modifiedCount,
        purchasesClaimed: purchaseUpdateResult.modifiedCount,
        invoicesClaimed: invoiceUpdateResult.modifiedCount,
      };
    } catch (error) {
      console.error(
        `❌ [Guest Order Claiming Error] Failed for ${email} (${userId}):`,
        error,
      );
      return {
        ordersClaimed: 0,
        purchasesClaimed: 0,
        invoicesClaimed: 0,
        error: error.message,
      };
    }
  }
}

const OrderService = new OrderServiceClass();
export default OrderService;
