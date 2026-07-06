import express from "express";
import { DashboardController } from "./dashboard.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Get dashboard data (combined)
router.get("/", DashboardController.getDashboardData);

// Get individual dashboard components
router.get("/stats", DashboardController.getStats);
router.get("/recent-books", DashboardController.getRecentBooks);
router.get("/recent-orders", DashboardController.getRecentOrders);
router.get("/activities", DashboardController.getActivityTimeline);
router.get("/assessment-progress", DashboardController.getAssessmentProgress);

export const DashboardRoutes = router;