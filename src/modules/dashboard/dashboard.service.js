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
  async getDashboardData(userId, email = null) {
    const [stats, recentBooks, recentOrders, activities, assessment] = await Promise.all([
      this.getUserStats(userId, email),
      this.getRecentBooks(userId, 4, email),
      this.getRecentOrders(userId, 3, email),
      this.getActivityTimeline(userId, 5, email),
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

  async getUserStats(userId, email = null) {
    const purchaseFilter = {
      accessStatus: "ACTIVE",
      ...(email
        ? {
            $or: [
              { userId: String(userId) },
              { customerEmail: email.toLowerCase().trim() },
            ],
          }
        : { userId: String(userId) }),
    };

    const orderFilter = email
      ? {
          $or: [
            { userId: String(userId) },
            { guestEmail: email.toLowerCase().trim() },
          ],
        }
      : { userId: String(userId) };

    const [books, orders, assessments, reviews] = await Promise.all([
      Purchase.countDocuments(purchaseFilter),
      Order.countDocuments(orderFilter),
      AssessmentSubmission.countDocuments({ userId }), // ✅ FIXED
      Review.countDocuments({ userId }),
    ]);

    return { books, orders, assessments, reviews };
  }

  async getRecentBooks(userId, limit = 4, email = null) {
    const filter = {
      accessStatus: "ACTIVE",
      ...(email
        ? {
            $or: [
              { userId: String(userId) },
              { customerEmail: email.toLowerCase().trim() },
            ],
          }
        : { userId: String(userId) }),
    };

    const purchases = await Purchase.find(filter)
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

  async getRecentOrders(userId, limit = 3, email = null) {
    const filter = email
      ? {
          $or: [
            { userId: String(userId) },
            { guestEmail: email.toLowerCase().trim() },
          ],
        }
      : { userId: String(userId) };

    const orders = await Order.find(filter)
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

  async getActivityTimeline(userId, limit = 5, email = null) {
    const activities = [];

    const orderFilter = email
      ? {
          $or: [
            { userId: String(userId) },
            { guestEmail: email.toLowerCase().trim() },
          ],
        }
      : { userId: String(userId) };

    const purchaseFilter = {
      accessStatus: "ACTIVE",
      ...(email
        ? {
            $or: [
              { userId: String(userId) },
              { customerEmail: email.toLowerCase().trim() },
            ],
          }
        : { userId: String(userId) }),
    };

    const orders = await Order.find(orderFilter)
      .sort({ createdAt: -1 })
      .limit(2);

    orders.forEach((order) => {
      activities.push({
        type: "ORDER_COMPLETED",
        description: `Order ${order.orderNumber} completed`,
        createdAt: order.createdAt,
      });
    });

    const purchases = await Purchase.find(purchaseFilter)
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
    const submissions = await AssessmentSubmission.find({ userId })
      .sort({ completedAt: -1 })
      .lean();

    if (submissions.length === 0) {
      return {
        hasAssessment: false,
      };
    }

    const latest = submissions[0];
    const previous = submissions.length > 1 ? submissions[1] : null;

    let scoreChange = null;
    let scoreChangeDirection = null;
    if (previous) {
      scoreChange = latest.overallScore - previous.overallScore;
      scoreChangeDirection = scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'unchanged';
    }

    return {
      hasAssessment: true,
      totalAssessments: submissions.length,
      latestScore: latest.overallScore,
      latestSubmissionId: latest._id,
      assessmentSlug: latest.assessmentSlug,
      previousScore: previous?.overallScore || null,
      scoreChange,
      scoreChangeDirection,
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