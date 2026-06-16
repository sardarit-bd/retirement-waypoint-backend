import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { OrderItem } from "./orderItem.model.js";
import ApiError from "../../utils/ApiError.js";

class OrderServiceClass {
  // Create order with items
  async createOrder(userId, orderData) {
    const { items: clientItems, notes } = orderData;

    if (!clientItems || clientItems.length === 0) {
      throw new ApiError(400, "Order must contain at least one item");
    }

    // Fetch books from database to get real prices and titles
    const { Book } = await import("../book/book.model.js");

    const bookIds = clientItems.map((item) => item.bookId);

    // Fetch all books in one query
    const books = await Book.find({
      _id: { $in: bookIds },
      status: "PUBLISHED",
      deletedAt: null,
    });

    if (books.length !== clientItems.length) {
      throw new ApiError(400, "One or more books are invalid or unavailable");
    }

    // Create book map for quick lookup
    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), {
        title: book.title,
        price: book.price,
      });
    });

    // Build order items from database data (NOT from client)
    const orderItems = clientItems.map((item) => {
      const bookData = bookMap.get(item.bookId);
      if (!bookData) {
        throw new ApiError(400, `Book ${item.bookId} not found or unavailable`);
      }

      return {
        bookId: item.bookId,
        bookTitle: bookData.title, // From database
        bookPrice: bookData.price, // From database
      };
    });

    // Calculate totals from database prices
    const subtotal = orderItems.reduce((sum, item) => sum + item.bookPrice, 0);
    const totalAmount = subtotal; // Add tax/shipping later

    // Start session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create order
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

      // Create order items with database values
      const orderItemsWithOrderId = orderItems.map((item) => ({
        ...item,
        orderId: order[0]._id,
      }));

      await OrderItem.create(orderItemsWithOrderId, { session });

      await session.commitTransaction();
      session.endSession();

      // Return order with items
      return this.getOrderById(order[0]._id);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
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

    const items = await OrderItem.find({ orderId: order._id });

    return {
      ...order.toObject(),
      items,
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

    // Search by order number
    if (search && search.trim()) {
      filter.orderNumber = { $regex: search.trim(), $options: "i" };
    }

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
}

const OrderService = new OrderServiceClass();
export default OrderService;
