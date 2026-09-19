import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      default: null,
      ref: "User",
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewerName: {
      type: String,
      default: null,
      trim: true,
    },
    reviewerEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: true,
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
  },
);

// Compound indexes with partial filters for guests vs registered users
reviewSchema.index(
  { userId: 1, bookId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "string" } } }
);
reviewSchema.index(
  { orderId: 1, bookId: 1 },
  { unique: true, partialFilterExpression: { orderId: { $type: "objectId" } } }
);
reviewSchema.index({ bookId: 1, status: 1 });
reviewSchema.index({ bookId: 1, isApproved: 1 });
reviewSchema.index({ bookId: 1, rating: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ isApproved: 1, createdAt: -1 });

// Ensure virtuals are included
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

export const Review = mongoose.model("Review", reviewSchema);
