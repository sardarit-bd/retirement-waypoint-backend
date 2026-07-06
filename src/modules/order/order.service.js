import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { OrderItem } from "./orderItem.model.js";
import ApiError from "../../utils/ApiError.js";
import { Book } from "../book/book.model.js";
import { Purchase } from "../purchase/purchase.model.js";
import CouponService from "../coupon/coupon.service.js";
import AuthService from "../auth/auth.service.js";

class OrderServiceClass {
  // Create order with items
  async createOrder(userId, orderData) {
    const { items: clientItems, notes } = orderData;

    if (!clientItems || clientItems.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    const bookIds = clientItems.map((item) => item.bookId);

    // ==========================
    // CHECK ALREADY PURCHASED
    // ==========================
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
            userId,
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

    // Fetch user from Better Auth
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
    const { items: clientItems, notes, couponCode } = orderData;

    if (!clientItems || clientItems.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    const bookIds = clientItems.map((item) => item.bookId);

    // Check already purchased
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
            userId,
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

  // async getOrderById(orderId) {
  //   console.log("ORDER ID =", orderId);
  //   console.log("TYPE =", typeof orderId);

  //   const order = await Order.findById(orderId);

  //   console.log("FOUND ORDER =", order);

  //   if (!order) {
  //     throw new ApiError(404, "Order not found");
  //   }

  //   const items = await OrderItem.find({ orderId: order._id });

  //   return {
  //     ...order.toObject(),
  //     items,
  //     // checkoutUrl is already included via toObject()
  //   };
  // }
}

const OrderService = new OrderServiceClass();
export default OrderService;
