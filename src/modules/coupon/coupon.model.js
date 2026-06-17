import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Coupon name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null,
    },
    type: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT"],
      required: [true, "Coupon type is required"],
      index: true,
    },
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [0.01, "Value must be greater than 0"],
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maximumDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per-user limit must be at least 1"],
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for checking if coupon is valid
couponSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
});

// Virtual for remaining usage
couponSchema.virtual("remainingUsage").get(function () {
  if (this.usageLimit === null) return null;
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Virtual for discount type display
couponSchema.virtual("discountDisplay").get(function () {
  if (this.type === "PERCENTAGE") {
    return `${this.value}%`;
  }
  return `$${this.value.toFixed(2)}`;
});

// Ensure virtuals are included
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

export const Coupon = mongoose.model("Coupon", couponSchema);