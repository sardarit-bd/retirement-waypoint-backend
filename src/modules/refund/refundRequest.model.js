import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: [true, "Purchase ID is required"],
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Refund reason is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [2000, "Details cannot exceed 2000 characters"],
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      required: [true, "Refund amount is required"],
      min: [0, "Refund amount cannot be negative"],
    },
    stripeRefundId: {
      type: String,
      default: null,
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
refundRequestSchema.index({ userId: 1, requestedAt: -1 });
refundRequestSchema.index({ orderId: 1 }, { unique: true });
refundRequestSchema.index({ status: 1, requestedAt: -1 });

// Virtual for isPending
refundRequestSchema.virtual("isPending").get(function () {
  return this.status === "PENDING";
});

// Virtual for isCompleted
refundRequestSchema.virtual("isCompleted").get(function () {
  return this.status === "COMPLETED";
});

// Virtual for isApproved
refundRequestSchema.virtual("isApproved").get(function () {
  return this.status === "APPROVED" || this.status === "COMPLETED";
});

// Ensure virtuals are included
refundRequestSchema.set("toJSON", { virtuals: true });
refundRequestSchema.set("toObject", { virtuals: true });

export const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);