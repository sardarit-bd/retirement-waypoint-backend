import mongoose from "mongoose";
import { Purchase } from "../purchase/purchase.model.js";
import { Review } from "./review.model.js";
import { Book } from "../book/book.model.js";
import ApiError from "../../utils/ApiError.js";


class ReviewServiceClass {
  /**
   * Verify user has purchased the book
   */
  async verifyPurchase(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    
    if (!purchase) {
      throw new ApiError(403, "You can only review books you have purchased");
    }
    
    return purchase;
  }

  /**
   * Check if user has already reviewed this book
   */
  async hasReviewed(userId, bookId) {
    const review = await Review.findOne({ userId, bookId });
    return !!review;
  }

  /**
   * Recalculate book rating statistics
   */
  async recalculateBookStats(bookId) {
    const stats = await Review.aggregate([
      {
        $match: {
          bookId,
          isApproved: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || { averageRating: 0, totalReviews: 0 };

    await Book.findByIdAndUpdate(
      bookId,
      {
        $set: {
          averageRating: Math.round(result.averageRating * 10) / 10,
          totalReviews: result.totalReviews,
        },
      },
      { new: true }
    );

    return result;
  }

  /**
   * Create review
   */
  async createReview(userId, reviewData) {
    const { bookId, rating, title, comment } = reviewData;

    // Verify purchase
    await this.verifyPurchase(userId, bookId);

    // Check if already reviewed
    const existingReview = await this.hasReviewed(userId, bookId);
    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this book");
    }

    // Create review
    const review = await Review.create({
      userId,
      bookId,
      rating,
      title,
      comment,
      isVerifiedPurchase: true,
      isApproved: false,
    });

    return review;
  }

  /**
   * Update review
   */
  async updateReview(reviewId, userId, updateData) {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new ApiError(404, "Review not found or you don't have permission");
    }

    // Check if already approved - if approved, need re-approval
    const wasApproved = review.isApproved;

    // Update fields
    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.comment !== undefined) review.comment = updateData.comment;

    // If review was approved, reset approval status
    if (wasApproved) {
      review.isApproved = false;
      review.approvedBy = null;
      review.approvedAt = null;
    }

    await review.save();

    // If it was approved and changed, recalculate stats
    if (wasApproved) {
      await this.recalculateBookStats(review.bookId);
    }

    return review;
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, userId, isAdmin = false) {
    const query = { _id: reviewId };
    if (!isAdmin) {
      query.userId = userId;
    }

    const review = await Review.findOne(query);
    if (!review) {
      throw new ApiError(404, "Review not found or you don't have permission");
    }

    const wasApproved = review.isApproved;
    const bookId = review.bookId;

    await review.deleteOne();

    // Recalculate stats if was approved
    if (wasApproved) {
      await this.recalculateBookStats(bookId);
    }

    return { success: true, message: "Review deleted successfully" };
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId, query = {}) {
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

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Review.countDocuments(filter),
    ]);

    // Get book details for each review
    const bookIds = reviews.map((r) => r.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    }).select("title coverImage authorName slug");

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    const enrichedReviews = reviews.map((review) => ({
      ...review.toObject(),
      book: bookMap.get(review.bookId) || null,
    }));

    return {
      reviews: enrichedReviews,
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

  /**
   * Get review by ID
   */
  async getReviewById(reviewId, userId, isAdmin = false) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Check permission
    if (!isAdmin && review.userId !== userId) {
      throw new ApiError(403, "You don't have permission to view this review");
    }

    // Get book details
    const book = await Book.findById(review.bookId).select(
      "title coverImage authorName slug"
    );

    return {
      ...review.toObject(),
      book,
    };
  }

  /**
   * Get all reviews (admin)
   */
  async getAllReviews(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      rating,
      approved,
      bookId,
      userId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (rating) filter.rating = rating;
    if (bookId) filter.bookId = bookId;
    if (userId) filter.userId = userId;
    if (approved !== undefined) {
      filter.isApproved = approved === "true";
    }

    // Search in title and comment
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: searchRegex }, { comment: searchRegex }];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate("userId", "name email"),
      Review.countDocuments(filter),
    ]);

    // Get book details
    const bookIds = reviews.map((r) => r.bookId);
    const books = await Book.find({
      _id: { $in: bookIds },
    }).select("title coverImage authorName");

    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    const enrichedReviews = reviews.map((review) => ({
      ...review.toObject(),
      book: bookMap.get(review.bookId) || null,
    }));

    return {
      reviews: enrichedReviews,
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

  /**
   * Approve review (admin)
   */
  async approveReview(reviewId, adminId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (review.isApproved) {
      throw new ApiError(400, "Review is already approved");
    }

    review.isApproved = true;
    review.approvedBy = adminId;
    review.approvedAt = new Date();
    await review.save();

    // Recalculate book stats
    await this.recalculateBookStats(review.bookId);

    return review;
  }

  /**
   * Reject review (admin)
   */
  async rejectReview(reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Delete the review
    await review.deleteOne();

    return { success: true, message: "Review rejected and deleted" };
  }

  /**
   * Get book reviews (public - approved only)
   */
  async getBookReviews(bookId, query = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      bookId,
      isApproved: true,
    };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .select("-userId -isVerifiedPurchase -approvedBy"),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
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

  /**
   * Get review summary (public)
   */
  async getReviewSummary(bookId) {
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    // Get rating breakdown
    const breakdown = await Review.aggregate([
      {
        $match: {
          bookId,
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    breakdown.forEach((item) => {
      ratingBreakdown[item._id] = item.count;
    });

    // Get total and average from Book model
    const totalReviews = book.totalReviews || 0;
    const averageRating = book.averageRating || 0;

    return {
      averageRating,
      totalReviews,
      ratingBreakdown,
    };
  }
}

const ReviewService = new ReviewServiceClass();
export default ReviewService;