import mongoose from "mongoose";

const downloadLogSchema = new mongoose.Schema(
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
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: [true, "Purchase ID is required"],
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