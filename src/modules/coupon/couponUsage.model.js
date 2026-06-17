import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: [true, "Coupon ID is required"],
      index: true,
    },
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
    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
      min: [0, "Discount amount cannot be negative"],
    },
    usedAt: {
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
couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ couponId: 1, usedAt: -1 });
couponUsageSchema.index({ userId: 1, usedAt: -1 });

export const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);