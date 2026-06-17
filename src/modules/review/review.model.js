import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    bookId: {
      type: String,
      required: [true, "Book ID is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
reviewSchema.index({ bookId: 1, isApproved: 1 });
reviewSchema.index({ bookId: 1, rating: 1 });
reviewSchema.index({ isApproved: 1, createdAt: -1 });

// Ensure virtuals are included
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

export const Review = mongoose.model("Review", reviewSchema);