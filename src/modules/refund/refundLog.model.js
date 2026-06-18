import mongoose from "mongoose";

const refundLogSchema = new mongoose.Schema(
  {
    refundRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefundRequest",
      required: [true, "Refund request ID is required"],
      index: true,
    },
    action: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", "STRIPE_REFUND", "REVOKED"],
      required: [true, "Action is required"],
    },
    performedBy: {
      type: String,
      required: [true, "Performed by is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
refundLogSchema.index({ refundRequestId: 1, createdAt: -1 });
refundLogSchema.index({ performedBy: 1, createdAt: -1 });

export const RefundLog = mongoose.model("RefundLog", refundLogSchema);