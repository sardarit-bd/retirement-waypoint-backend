import mongoose from "mongoose";
import { Purchase } from "../purchase/purchase.model.js";
import { Review } from "./review.model.js";
import { Book } from "../book/book.model.js";
import { Order } from "../order/order.model.js";
import { OrderItem } from "../order/orderItem.model.js";
import AuthService from "../auth/auth.service.js";
import MyBooksService from "../my-books/myBooks.service.js";
import ApiError from "../../utils/ApiError.js";

class ReviewServiceClass {
  /**
   * Check whether the user has purchased the book (registered or guest order)
   * Delegates to MyBooksService.hasPurchasedBook for consistency
   */
  async verifyPurchase(userId, bookId, userEmail = null) {
    return await MyBooksService.hasPurchasedBook(userId, bookId, userEmail);
  }

  async getMyReview(userId, bookId) {
    const bookConditions = [{ bookId: bookId.toString() }];
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      bookConditions.push({ bookId: new mongoose.Types.ObjectId(bookId.toString()) });
    }

    return await Review.findOne({
      userId,
      $or: bookConditions,
    });
  }

  /**
   * Check if user has already reviewed this book
   */
  async hasReviewed(userId, bookId) {
    const review = await this.getMyReview(userId, bookId);
    return !!review;
  }

  /**
   * Recalculate book rating statistics (Approved reviews only)
   */
  async recalculateBookStats(bookId) {
    const bookConditions = [{ bookId: bookId.toString() }];
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      bookConditions.push({ bookId: new mongoose.Types.ObjectId(bookId.toString()) });
    }

    const stats = await Review.aggregate([
      {
        $match: {
          $and: [
            { $or: bookConditions },
            {
              $or: [
                { status: "APPROVED" },
                { isApproved: true, status: { $ne: "REJECTED" } },
              ],
            },
          ],
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
      { new: true },
    );

    return result;
  }

  /**
   * Create review
   * Strictly enforces verified buyer purchase check
   */
  async createReview(userId, reviewData, userEmail = null) {
    const { bookId, rating, title, comment } = reviewData;

    // 1. Check if already reviewed (enforce one review per user per book)
    const existingReview = await this.hasReviewed(userId, bookId);
    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this book");
    }

    // 2. Strictly verify purchase using existing service
    const hasBought = await MyBooksService.hasPurchasedBook(
      userId,
      bookId,
      userEmail,
    );
    if (!hasBought) {
      throw new ApiError(
        403,
        "Only verified purchasers of this book can submit reviews.",
      );
    }

    // 3. Create review with PENDING status
    const review = await Review.create({
      userId,
      bookId,
      rating,
      title,
      comment,
      status: "PENDING",
      isVerifiedBuyer: true,
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

    const wasApproved = review.isApproved || review.status === "APPROVED";

    // Update fields
    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.comment !== undefined) review.comment = updateData.comment;

    // Any edit moves review back to PENDING moderation
    review.status = "PENDING";
    review.isApproved = false;
    review.approvedBy = null;
    review.approvedAt = null;

    await review.save();

    // If it was previously approved, recalculate stats
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

    const wasApproved = review.isApproved || review.status === "APPROVED";
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
      book: bookMap.get(review.bookId?.toString()) || null,
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
      "title coverImage authorName slug",
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
      status,
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

    if (status) {
      filter.status = status;
    } else if (approved !== undefined) {
      if (approved === "true") {
        filter.$or = [{ status: "APPROVED" }, { isApproved: true }];
      } else {
        filter.$or = [{ status: "PENDING" }, { isApproved: false }];
      }
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
        .select("-approvedBy"),
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
      book: bookMap.get(review.bookId?.toString()) || null,
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
   * Update review status (admin) - APPROVED or REJECTED
   */
  async updateReviewStatus(reviewId, status, adminId = null) {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new ApiError(400, "Invalid status. Status must be APPROVED or REJECTED.");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    const wasApproved = review.isApproved || review.status === "APPROVED";

    if (status === "APPROVED") {
      review.status = "APPROVED";
      review.isApproved = true;
      review.approvedBy = adminId;
      review.approvedAt = new Date();
    } else if (status === "REJECTED") {
      review.status = "REJECTED";
      review.isApproved = false;
    }

    await review.save();

    // Recalculate book stats if becoming approved or leaving approved status
    if (status === "APPROVED" || wasApproved) {
      await this.recalculateBookStats(review.bookId);
    }

    return review;
  }

  /**
   * Approve review (admin)
   */
  async approveReview(reviewId, adminId) {
    return await this.updateReviewStatus(reviewId, "APPROVED", adminId);
  }

  /**
   * Reject review (admin)
   */
  async rejectReview(reviewId, adminId = null) {
    return await this.updateReviewStatus(reviewId, "REJECTED", adminId);
  }

  /**
   * Get book reviews (public - APPROVED strictly only)
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

    const bookConditions = [{ bookId: bookId.toString() }];
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      bookConditions.push({ bookId: new mongoose.Types.ObjectId(bookId.toString()) });
    }

    const filter = {
      $and: [
        { $or: bookConditions },
        {
          $or: [
            { status: "APPROVED" },
            { isApproved: true, status: { $ne: "REJECTED" } },
          ],
        },
      ],
    };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .select("-approvedBy"),
      Review.countDocuments(filter),
    ]);

    const userCollection = mongoose.connection.db.collection("user");

    const userIds = reviews
      .map((review) => review.userId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const users = await userCollection
      .find({
        _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const enrichedReviews = reviews.map((review) => ({
      ...review.toObject(),
      user: {
        id: review.userId,
        name: userMap.get(review.userId)?.name || "Anonymous User",
        image: userMap.get(review.userId)?.image || null,
      },
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
   * Get review summary (public - APPROVED strictly only)
   */
  async getReviewSummary(bookId) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    const bookConditions = [{ bookId: bookId.toString() }];
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      bookConditions.push({ bookId: new mongoose.Types.ObjectId(bookId.toString()) });
    }

    // Get average rating, total reviews & rating breakdown
    const stats = await Review.aggregate([
      {
        $match: {
          $and: [
            { $or: bookConditions },
            {
              $or: [
                { status: "APPROVED" },
                { isApproved: true, status: { $ne: "REJECTED" } },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ]);

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalReviews = 0;
    let totalRating = 0;

    stats.forEach((item) => {
      ratingBreakdown[item._id] = item.count;

      totalReviews += item.count;
      totalRating += item._id * item.count;
    });

    const averageRating =
      totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      ratingBreakdown,
    };
  }
}

const ReviewService = new ReviewServiceClass();
export default ReviewService;
