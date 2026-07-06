import mongoose from "mongoose";
import { Order } from "../order/order.model.js";
import { OrderItem } from "../order/orderItem.model.js";
import { Purchase } from "../purchase/purchase.model.js";
import { Book } from "../book/book.model.js";
import { Invoice } from "../invoice/invoice.model.js";
import { DownloadLog } from "../download/downloadLog.model.js";
import { Review } from "../review/review.model.js";
import { Coupon } from "../coupon/coupon.model.js";
import { CouponUsage } from "../coupon/couponUsage.model.js";
import { UserProfile } from "../auth/auth.model.js";
import ApiError from "../../utils/ApiError.js";

class AnalyticsServiceClass {
  /**
   * Get date range filter for MongoDB queries
   */
  getDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  /**
   * Get date range filter for purchasedAt
   */
  getPurchaseDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.purchasedAt = {};
      if (dateFrom) filter.purchasedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.purchasedAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  /**
   * Get date range filter for issuedAt
   */
  getInvoiceDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.issuedAt = {};
      if (dateFrom) filter.issuedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.issuedAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  /**
   * Get date range filter for downloadedAt
   */
  getDownloadDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.downloadedAt = {};
      if (dateFrom) filter.downloadedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.downloadedAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  /**
   * Get date range filter for usedAt
   */
  getCouponUsageDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.usedAt = {};
      if (dateFrom) filter.usedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.usedAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  /**
   * Get date range filter for reviews
   */
  getReviewDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    return filter;
  }

  // ==================== OVERVIEW DASHBOARD ====================

  /**
   * Get overview dashboard data
   */
  async getOverview(query = {}) {
    const { dateFrom, dateTo } = query;
    const dateFilter = this.getDateRangeFilter(dateFrom, dateTo);

    // Get all orders (including unpaid for revenue calculation)
    const orders = await Order.find({
      ...dateFilter,
      paymentStatus: "PAID",
    });

    const allOrders = await Order.find(dateFilter);

    // Get purchases
    const purchaseFilter = this.getPurchaseDateRangeFilter(dateFrom, dateTo);
    const purchases = await Purchase.find(purchaseFilter);

    // Get books
    const books = await Book.find({ deletedAt: null });

    // Get users
    const users = await UserProfile.find();

    // Get downloads
    const downloadFilter = this.getDownloadDateRangeFilter(dateFrom, dateTo);
    const downloads = await DownloadLog.find(downloadFilter);

    // Get reviews
    const reviewFilter = this.getReviewDateRangeFilter(dateFrom, dateTo);
    const reviews = await Review.find(reviewFilter);

    // Get coupon usage
    const couponUsageFilter = this.getCouponUsageDateRangeFilter(dateFrom, dateTo);
    const couponUsages = await CouponUsage.find(couponUsageFilter);

    // Calculate revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (order) => new Date(order.createdAt) >= today
    );
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthOrders = orders.filter(
      (order) => new Date(order.createdAt) >= monthStart
    );
    const monthlyRevenue = monthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearOrders = orders.filter(
      (order) => new Date(order.createdAt) >= yearStart
    );
    const yearlyRevenue = yearOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate average rating
    const approvedReviews = reviews.filter((r) => r.isApproved);
    const averageRating =
      approvedReviews.length > 0
        ? Math.round(
            (approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length) *
              10
          ) / 10
        : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      yearlyRevenue: Math.round(yearlyRevenue * 100) / 100,
      totalOrders: allOrders.length,
      totalPaidOrders: orders.length,
      totalBooks: books.length,
      totalPurchases: purchases.length,
      totalUsers: users.length,
      totalDownloads: downloads.length,
      totalReviews: reviews.length,
      totalCouponsUsed: couponUsages.length,
      averageRating,
    };
  }

  // ==================== REVENUE ANALYTICS ====================

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(query = {}) {
    const { period = "monthly", dateFrom, dateTo } = query;

    const matchStage = {
      paymentStatus: "PAID",
    };

    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    let dateFormat;
    let groupBy;

    switch (period) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        groupBy = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
        break;
      case "weekly":
        dateFormat = "%Y-W%V";
        groupBy = { week: { $week: "$createdAt" }, year: { $year: "$createdAt" } };
        break;
      case "yearly":
        dateFormat = "%Y";
        groupBy = { year: { $year: "$createdAt" } };
        break;
      default: // monthly
        dateFormat = "%Y-%m";
        groupBy = { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
        break;
    }

    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            ...groupBy,
          },
          revenue: { $sum: "$totalAmount" },
          ordersCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
      },
    ]);

    // Format period labels
    const formattedData = revenueData.map((item) => {
      let periodLabel = "";
      if (period === "daily") {
        periodLabel = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
      } else if (period === "weekly") {
        periodLabel = `${item._id.year}-W${String(item._id.week).padStart(2, "0")}`;
      } else if (period === "yearly") {
        periodLabel = String(item._id.year);
      } else {
        periodLabel = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      }

      return {
        period: periodLabel,
        revenue: Math.round(item.revenue * 100) / 100,
        ordersCount: item.ordersCount,
      };
    });

    return {
      period,
      data: formattedData,
      totalRevenue: formattedData.reduce((sum, item) => sum + item.revenue, 0),
      totalOrders: formattedData.reduce((sum, item) => sum + item.ordersCount, 0),
    };
  }

  // ==================== ORDER ANALYTICS ====================

  /**
   * Get order analytics
   */
  async getOrderAnalytics(query = {}) {
    const { dateFrom, dateTo } = query;
    const dateFilter = this.getDateRangeFilter(dateFrom, dateTo);

    const orders = await Order.find(dateFilter);

    const statusCounts = {
      PENDING: 0,
      PAID: 0,
      FAILED: 0,
      REFUNDED: 0,
    };

    orders.forEach((order) => {
      if (statusCounts.hasOwnProperty(order.paymentStatus)) {
        statusCounts[order.paymentStatus]++;
      }
    });

    // Calculate conversion rate
    const totalOrders = orders.length;
    const paidOrders = statusCounts.PAID;
    const conversionRate =
      totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 10000) / 100 : 0;

    // Get daily order trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          ...(dateFrom || dateTo ? dateFilter : {}),
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$paymentStatus",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          orders: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = trendData.map((item) => {
      const statusMap = {};
      item.orders.forEach((o) => {
        statusMap[o.status] = o.count;
      });
      return {
        date: item._id,
        PENDING: statusMap.PENDING || 0,
        PAID: statusMap.PAID || 0,
        FAILED: statusMap.FAILED || 0,
        REFUNDED: statusMap.REFUNDED || 0,
      };
    });

    return {
      totalOrders,
      paidOrders,
      pendingOrders: statusCounts.PENDING,
      failedOrders: statusCounts.FAILED,
      refundedOrders: statusCounts.REFUNDED,
      conversionRate,
      trends,
    };
  }

  // ==================== BOOK ANALYTICS ====================

  /**
   * Get book analytics
   */
  async getBookAnalytics(query = {}) {
    const { limit = 10, sortBy = "sales", sortOrder = "desc" } = query;

    // Get all books
    const books = await Book.find({ deletedAt: null });

    // Get order items for all books
    const orderItems = await OrderItem.find();

    // Get purchases
    const purchases = await Purchase.find({ accessStatus: "ACTIVE" });

    // Get downloads
    const downloads = await DownloadLog.find();

    // Get reviews
    const reviews = await Review.find({ isApproved: true });

    // Build book analytics
    const bookStats = await Promise.all(
      books.map(async (book) => {
        const bookId = book._id.toString();

        // Sales (from order items)
        const sales = orderItems.filter((item) => item.bookId === bookId);
        const totalSales = sales.reduce((sum, item) => sum + item.bookPrice, 0);

        // Purchases
        const purchaseCount = purchases.filter(
          (p) => p.bookId === bookId
        ).length;

        // Downloads
        const downloadCount = downloads.filter(
          (d) => d.bookId === bookId
        ).length;

        // Reviews
        const bookReviews = reviews.filter((r) => r.bookId === bookId);
        const reviewCount = bookReviews.length;
        const avgRating =
          reviewCount > 0
            ? Math.round(
                (bookReviews.reduce((sum, r) => sum + r.rating, 0) /
                  reviewCount) *
                  10
              ) / 10
            : 0;

        return {
          bookId: book._id,
          title: book.title,
          authorName: book.authorName,
          coverImage: book.coverImage,
          price: book.price,
          sales: Math.round(totalSales * 100) / 100,
          purchaseCount,
          downloadCount,
          reviewCount,
          averageRating: avgRating,
          hasSales: totalSales > 0,
          hasReviews: reviewCount > 0,
        };
      })
    );

    // Sort by selected field
    const sortKey = sortBy === "sales" ? "sales" :
                    sortBy === "purchases" ? "purchaseCount" :
                    sortBy === "downloads" ? "downloadCount" :
                    sortBy === "rating" ? "averageRating" : "sales";

    const sortedBooks = [...bookStats].sort((a, b) => {
      const aVal = a[sortKey] || 0;
      const bVal = b[sortKey] || 0;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    const topBooks = sortedBooks.slice(0, limit);
    const leastSelling = sortedBooks.filter((b) => b.sales === 0).slice(0, limit);
    const noSales = bookStats.filter((b) => !b.hasSales);
    const noReviews = bookStats.filter((b) => !b.hasReviews);

    return {
      topSelling: topBooks,
      leastSelling: leastSelling.length > 0 ? leastSelling.slice(0, limit) : [],
      mostPurchased: [...sortedBooks]
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, limit),
      mostDownloaded: [...sortedBooks]
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, limit),
      highestRated: [...sortedBooks]
        .sort((a, b) => b.averageRating - a.averageRating)
        .filter((b) => b.averageRating > 0)
        .slice(0, limit),
      lowestRated: [...sortedBooks]
        .sort((a, b) => a.averageRating - b.averageRating)
        .filter((b) => b.averageRating > 0)
        .slice(0, limit),
      noSalesCount: noSales.length,
      noReviewsCount: noReviews.length,
    };
  }

  // ==================== PURCHASE ANALYTICS ====================

  /**
   * Get purchase analytics
   */
  async getPurchaseAnalytics(query = {}) {
    const { dateFrom, dateTo } = query;
    const filter = this.getPurchaseDateRangeFilter(dateFrom, dateTo);

    const purchases = await Purchase.find(filter);

    // Daily purchases (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyPurchases = await Purchase.aggregate([
      {
        $match: {
          purchasedAt: { $gte: thirtyDaysAgo },
          ...(dateFrom || dateTo ? filter : {}),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly purchases
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyPurchases = await Purchase.aggregate([
      {
        $match: {
          purchasedAt: { $gte: monthStart },
          ...(dateFrom || dateTo ? filter : {}),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$purchasedAt" },
            month: { $month: "$purchasedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get orders for average order value
    const orderFilter = this.getDateRangeFilter(dateFrom, dateTo);
    const paidOrders = await Order.find({
      ...orderFilter,
      paymentStatus: "PAID",
    });

    const totalOrderValue = paidOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const averageOrderValue =
      paidOrders.length > 0 ? totalOrderValue / paidOrders.length : 0;

    // Repeat customers (users with multiple purchases)
    const userPurchaseCounts = {};
    purchases.forEach((p) => {
      userPurchaseCounts[p.userId] = (userPurchaseCounts[p.userId] || 0) + 1;
    });

    const repeatCustomers = Object.values(userPurchaseCounts).filter(
      (count) => count > 1
    ).length;

    return {
      totalPurchases: purchases.length,
      dailyPurchases: dailyPurchases.map((d) => ({
        date: d._id,
        count: d.count,
      })),
      monthlyPurchases: monthlyPurchases.map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
        count: m.count,
      })),
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      repeatCustomers,
    };
  }

  // ==================== DOWNLOAD ANALYTICS ====================

  /**
   * Get download analytics
   */
  async getDownloadAnalytics(query = {}) {
    const { dateFrom, dateTo, limit = 10 } = query;
    const filter = this.getDownloadDateRangeFilter(dateFrom, dateTo);

    const downloads = await DownloadLog.find(filter);

    // Total downloads
    const totalDownloads = downloads.length;

    // Downloads by book
    const downloadsByBook = await DownloadLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$bookId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookId: "$_id",
          bookTitle: "$book.title",
          bookAuthor: "$book.authorName",
          downloadCount: "$count",
        },
      },
    ]);

    // Downloads by user
    const downloadsByUser = await DownloadLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    // Most downloaded books
    const mostDownloaded = downloadsByBook.map((item) => ({
      bookId: item.bookId,
      title: item.bookTitle || "Unknown Book",
      author: item.bookAuthor || "Unknown Author",
      downloads: item.downloadCount,
    }));

    return {
      totalDownloads,
      downloadsByBook: downloadsByBook,
      downloadsByUser: downloadsByUser,
      mostDownloaded,
    };
  }

  // ==================== REVIEW ANALYTICS ====================

  /**
   * Get review analytics
   */
  async getReviewAnalytics(query = {}) {
    const { dateFrom, dateTo } = query;
    const filter = this.getReviewDateRangeFilter(dateFrom, dateTo);

    const reviews = await Review.find(filter);
    const approvedReviews = reviews.filter((r) => r.isApproved);
    const pendingReviews = reviews.filter((r) => !r.isApproved);

    // Rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    approvedReviews.forEach((review) => {
      if (ratingDistribution.hasOwnProperty(review.rating)) {
        ratingDistribution[review.rating]++;
      }
    });

    // Average rating
    const averageRating =
      approvedReviews.length > 0
        ? Math.round(
            (approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length) *
              10
          ) / 10
        : 0;

    // Most reviewed books
    const mostReviewedBooks = await Review.aggregate([
      { $match: { ...filter, isApproved: true } },
      {
        $group: {
          _id: "$bookId",
          reviewCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookId: "$_id",
          bookTitle: "$book.title",
          bookAuthor: "$book.authorName",
          reviewCount: 1,
          averageRating: { $round: ["$avgRating", 1] },
        },
      },
    ]);

    // Highest rated books (with at least 3 reviews)
    const highestRatedBooks = await Review.aggregate([
      { $match: { ...filter, isApproved: true } },
      {
        $group: {
          _id: "$bookId",
          reviewCount: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $match: { reviewCount: { $gte: 3 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookId: "$_id",
          bookTitle: "$book.title",
          bookAuthor: "$book.authorName",
          reviewCount: 1,
          averageRating: { $round: ["$avgRating", 1] },
        },
      },
    ]);

    return {
      totalReviews: reviews.length,
      approvedReviews: approvedReviews.length,
      pendingReviews: pendingReviews.length,
      averageRating,
      ratingDistribution,
      mostReviewedBooks,
      highestRatedBooks,
    };
  }

  // ==================== COUPON ANALYTICS ====================

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(query = {}) {
    const { dateFrom, dateTo, limit = 10 } = query;
    const filter = this.getCouponUsageDateRangeFilter(dateFrom, dateTo);

    const couponUsages = await CouponUsage.find(filter);

    // Total discount amount
    const totalDiscountAmount = couponUsages.reduce(
      (sum, usage) => sum + usage.discountAmount,
      0
    );

    // Most used coupons
    const mostUsedCoupons = await CouponUsage.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$couponId",
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "coupons",
          localField: "_id",
          foreignField: "_id",
          as: "coupon",
        },
      },
      { $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          couponId: "$_id",
          couponCode: "$coupon.code",
          couponName: "$coupon.name",
          couponType: "$coupon.type",
          usageCount: 1,
          totalDiscount: { $round: ["$totalDiscount", 2] },
        },
      },
    ]);

    // Coupon usage by type
    const usageByType = await CouponUsage.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      { $unwind: "$coupon" },
      {
        $group: {
          _id: "$coupon.type",
          count: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
        },
      },
    ]);

    // Revenue impact (how much revenue came from orders with coupons)
    const ordersWithCoupons = await Order.find({
      couponId: { $ne: null },
      paymentStatus: "PAID",
      ...this.getDateRangeFilter(dateFrom, dateTo),
    });

    const revenueWithCoupons = ordersWithCoupons.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Conversion impact (percentage of orders that used coupons)
    const totalOrders = await Order.countDocuments({
      paymentStatus: "PAID",
      ...this.getDateRangeFilter(dateFrom, dateTo),
    });

    const ordersWithCouponCount = ordersWithCoupons.length;
    const conversionImpact =
      totalOrders > 0
        ? Math.round((ordersWithCouponCount / totalOrders) * 10000) / 100
        : 0;

    return {
      totalCouponUsages: couponUsages.length,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      mostUsedCoupons,
      usageByType,
      revenueWithCoupons: Math.round(revenueWithCoupons * 100) / 100,
      ordersWithCoupons: ordersWithCouponCount,
      conversionImpact,
    };
  }

  // ==================== USER ANALYTICS ====================

  /**
   * Get user analytics
   */
  async getUserAnalytics(query = {}) {
    const { dateFrom, dateTo, limit = 10 } = query;

    const userProfiles = await UserProfile.find();

    // Total users
    const totalUsers = userProfiles.length;

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = userProfiles.filter(
      (u) => new Date(u.createdAt) >= today
    ).length;

    // New users this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthUsers = userProfiles.filter(
      (u) => new Date(u.createdAt) >= monthStart
    ).length;

    // Most active users (based on purchase count)
    const purchases = await Purchase.find({
      accessStatus: "ACTIVE",
      ...(dateFrom || dateTo
        ? this.getPurchaseDateRangeFilter(dateFrom, dateTo)
        : {}),
    });

    const userPurchaseCounts = {};
    purchases.forEach((p) => {
      userPurchaseCounts[p.userId] = (userPurchaseCounts[p.userId] || 0) + 1;
    });

    const sortedUsers = Object.entries(userPurchaseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, purchaseCount: count }));

    // Repeat buyers (users with > 1 purchase)
    const repeatBuyers = Object.values(userPurchaseCounts).filter(
      (count) => count > 1
    ).length;

    return {
      totalUsers,
      newUsersToday: todayUsers,
      newUsersThisMonth: monthUsers,
      mostActiveUsers: sortedUsers,
      repeatBuyers,
    };
  }
}

const AnalyticsService = new AnalyticsServiceClass();
export default AnalyticsService;