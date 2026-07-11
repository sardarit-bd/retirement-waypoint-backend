import mongoose from "mongoose";
import { Purchase } from "../purchase/purchase.model.js";
import { Order } from "../order/order.model.js";
import { Review } from "../review/review.model.js";
import { Book } from "../book/book.model.js";
import { AssessmentSubmission } from "../assessment-submission/assessmentSubmission.model.js";

class DashboardServiceClass {
  /**
   * Get user dashboard data
   */
  async getDashboardData(userId) {
    const [stats, recentBooks, recentOrders, activities, assessment] = await Promise.all([
      this.getUserStats(userId),
      this.getRecentBooks(userId, 4),
      this.getRecentOrders(userId, 3),
      this.getActivityTimeline(userId, 5),
      this.getAssessmentProgress(userId),
    ]);

    return {
      stats,
      recentBooks,
      recentOrders,
      activities,
      assessment,
      recommendations: this.getRecommendations(userId, stats),
    };
  }

  async getUserStats(userId) {
    const [books, orders, assessments, reviews] = await Promise.all([
      Purchase.countDocuments({ userId, accessStatus: "ACTIVE" }),
      Order.countDocuments({ userId }),
      AssessmentSubmission.countDocuments({ userId }), // ✅ FIXED
      Review.countDocuments({ userId }),
    ]);

    return { books, orders, assessments, reviews };
  }

  async getRecentBooks(userId, limit = 4) {
    const purchases = await Purchase.find({
      userId,
      accessStatus: "ACTIVE",
    })
      .sort({ purchasedAt: -1 })
      .limit(limit);

    if (purchases.length === 0) return [];

    const bookIds = purchases.map((p) => p.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    }).select("-pdfFile -pdfFilePublicId");

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    return purchases.map((purchase) => ({
      bookId: purchase.bookId,
      title: bookMap.get(purchase.bookId)?.title || "Unknown",
      authorName: bookMap.get(purchase.bookId)?.authorName || "Unknown",
      coverImage: bookMap.get(purchase.bookId)?.coverImage || null,
      purchasedAt: purchase.purchasedAt,
    }));
  }

  async getRecentOrders(userId, limit = 3) {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    }));
  }

  async getActivityTimeline(userId, limit = 5) {
    const activities = [];

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(2);

    orders.forEach((order) => {
      activities.push({
        type: "ORDER_COMPLETED",
        description: `Order ${order.orderNumber} completed`,
        createdAt: order.createdAt,
      });
    });

    const purchases = await Purchase.find({ userId })
      .sort({ purchasedAt: -1 })
      .limit(2);

    for (const purchase of purchases) {
      const book = await Book.findById(purchase.bookId).select("title");
      activities.push({
        type: "BOOK_PURCHASED",
        description: `Purchased "${book?.title || 'Book'}"`,
        createdAt: purchase.purchasedAt,
      });
    }

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    reviews.forEach((review) => {
      activities.push({
        type: "REVIEW_ADDED",
        description: `Added a review`,
        createdAt: review.createdAt,
      });
    });

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return activities.slice(0, limit);
  }

  async getAssessmentProgress(userId) {
    const submissions = await AssessmentSubmission.find({ userId }) // ✅ FIXED
      .sort({ completedAt: -1 });

    if (submissions.length === 0) {
      return {
        hasAssessment: false,
        progress: 0,
        score: 0,
      };
    }

    const total = submissions.length;
    const progress = Math.min(total * 20, 100);

    return {
      hasAssessment: true,
      progress,
      score: submissions[0]?.overallScore || 0, // ✅ FIXED: use overallScore
      totalAssessments: total,
    };
  }

  async getRecommendations(userId, stats) {
    const recommendations = [];

    if (stats.books === 0) {
      recommendations.push({
        id: "browse-books",
        label: "Explore New Books",
        description: "Discover books to support your retirement journey",
        icon: "BookOpen",
        href: "/book",
        color: "text-[#C9A84C] bg-[#C9A84C]/10",
      });
    }

    if (stats.assessments === 0) {
      recommendations.push({
        id: "continue-assessment",
        label: "Start Assessment",
        description: "Begin your retirement readiness assessment",
        icon: "ClipboardCheck",
        href: "/dashboard/assessments",
        color: "text-emerald-500 bg-emerald-500/10",
      });
    }

    recommendations.push({
      id: "retirement-tips",
      label: "Retirement Tips",
      description: "Expert advice for your golden years",
      icon: "Lightbulb",
      href: "/resources",
      color: "text-purple-500 bg-purple-500/10",
    });

    return recommendations;
  }
}

const DashboardService = new DashboardServiceClass();
export default DashboardService;