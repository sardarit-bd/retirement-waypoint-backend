import mongoose from "mongoose";

const downloadLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    guestEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    bookId: {
      type: String,
      required: [true, "Book ID is required"],
      index: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: false,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics
downloadLogSchema.index({ userId: 1, downloadedAt: -1 });
downloadLogSchema.index({ bookId: 1, downloadedAt: -1 });
downloadLogSchema.index({ userId: 1, bookId: 1 });

export const DownloadLog = mongoose.model("DownloadLog", downloadLogSchema);