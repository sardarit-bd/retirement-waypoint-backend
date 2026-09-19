import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import OrderService from "./order.service.js";
import ApiError from "../../utils/ApiError.js";

const createOrder = catchAsync(async (req, res) => {
  if (req.user?.role === "admin") {
    throw new ApiError(403, "Administrators cannot purchase their own books.");
  }

  const userId = req.user?.id || null;
  const order = await OrderService.applyCouponToOrder(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Order created successfully",
    data: order,
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.getOrderById(id);

  // Check if user is admin or order owner
  const isAdmin = req.user.role === "admin";
  const isOwner = await OrderService.isOrderOwner(id, req.user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "You don't have permission to view this order");
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order retrieved successfully",
    data: order,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  if (req.user?.id && req.user?.email) {
    await OrderService.claimGuestOrders(req.user.id, req.user.email);
  }

  const query = req.validatedQuery || req.query;
  const result = await OrderService.getUserOrders(req.user.id, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Orders retrieved successfully",
    data: result.orders,
    meta: result.pagination,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await OrderService.getAllOrders(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Orders retrieved successfully",
    data: result.orders,
    meta: result.pagination,
  });
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, stripeSessionId, stripePaymentIntentId } = req.body;

  const order = await OrderService.updatePaymentStatus(id, paymentStatus, {
    stripeSessionId,
    stripePaymentIntentId,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment status updated successfully",
    data: order,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  const order = await OrderService.updateOrderStatus(id, orderStatus);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order status updated successfully",
    data: order,
  });
});

const downloadByToken = catchAsync(async (req, res) => {
  const { token } = req.params;
  const clientInfo = {
    ipAddress: req.ip || req.headers["x-forwarded-for"],
    userAgent: req.headers["user-agent"],
  };

  const result = await OrderService.downloadByToken(token, req.query, clientInfo);

  if (req.query.redirect === "true") {
    return res.redirect(result.downloadUrl);
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Download URL generated successfully",
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updatePaymentStatus,
  updateOrderStatus,
  downloadByToken,
};