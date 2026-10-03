import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import DashboardService from "./dashboard.service.js";
import OrderService from "../order/order.service.js";

const getDashboardData = catchAsync(async (req, res) => {
  if (req.user?.id && req.user?.email) {
    await OrderService.claimGuestOrders(req.user.id, req.user.email);
  }

  const data = await DashboardService.getDashboardData(
    req.user.id,
    req.user?.email,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard data retrieved successfully",
    data,
  });
});

const getStats = catchAsync(async (req, res) => {
  if (req.user?.id && req.user?.email) {
    await OrderService.claimGuestOrders(req.user.id, req.user.email);
  }

  const stats = await DashboardService.getUserStats(
    req.user.id,
    req.user?.email,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard stats retrieved successfully",
    data: stats,
  });
});

const getRecentBooks = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const books = await DashboardService.getRecentBooks(
    req.user.id,
    limit,
    req.user?.email,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Recent books retrieved successfully",
    data: books,
  });
});

const getRecentOrders = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const orders = await DashboardService.getRecentOrders(
    req.user.id,
    limit,
    req.user?.email,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Recent orders retrieved successfully",
    data: orders,
  });
});

const getActivityTimeline = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const activities = await DashboardService.getActivityTimeline(
    req.user.id,
    limit,
    req.user?.email,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Activity timeline retrieved successfully",
    data: activities,
  });
});

const getAssessmentProgress = catchAsync(async (req, res) => {
  const progress = await DashboardService.getAssessmentProgress(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Assessment progress retrieved successfully",
    data: progress,
  });
});

export const DashboardController = {
  getDashboardData,
  getStats,
  getRecentBooks,
  getRecentOrders,
  getActivityTimeline,
  getAssessmentProgress,
};