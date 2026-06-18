import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

// Generate unique order number with better collision resistance
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // 6 character random string (more collision-resistant than 4-digit number)
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
  const random = nanoid();

  return `ORD-${year}${month}${day}${hours}${minutes}-${random}`;
};

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    // ==================== COUPON FIELDS (NEW) ====================
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
      index: true,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    // ===============================================================
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    // Future Stripe fields
    stripeSessionId: {
      type: String,
      default: null,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create compound indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ orderNumber: 1 });
// Coupon indexes
orderSchema.index({ couponId: 1 });
orderSchema.index({ couponCode: 1 });

// Pre-save middleware to generate unique order number
orderSchema.pre("save", async function () {
  if (this.isNew && !this.orderNumber) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      const newOrderNumber = generateOrderNumber();

      const existing = await mongoose
        .model("Order")
        .findOne({ orderNumber: newOrderNumber });

      if (!existing) {
        this.orderNumber = newOrderNumber;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error(
        "Failed to generate unique order number after multiple attempts",
      );
    }
  }
});

// Virtual for total items count
orderSchema.virtual("itemsCount").get(function () {
  return this.items?.length || 0;
});

// ✅ Virtual to check if coupon was applied
orderSchema.virtual("hasCoupon").get(function () {
  return !!(this.couponId && this.discountAmount > 0);
});

// Ensure virtuals are included in JSON output
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export const Order = mongoose.model("Order", orderSchema);