import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import OrderService from "./order.service.js";
import ApiError from "../../utils/ApiError.js";

const createOrder = catchAsync(async (req, res) => {
  const order = await OrderService.applyCouponToOrder(req.user.id, req.body);

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

export const OrderController = {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updatePaymentStatus,
  updateOrderStatus,
};