import mongoose from "mongoose";

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
      default: () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");

        return `ORD-${year}${month}${day}-${random}`;
      },
    },
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

// Pre-save middleware to generate order number
// orderSchema.pre("save", async function (next) {
//   if (this.isNew && !this.orderNumber) {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const random = Math.floor(Math.random() * 10000)
//       .toString()
//       .padStart(4, "0");
//     this.orderNumber = `ORD-${year}${month}${day}-${random}`;
//   }
//   next();
// });

// Virtual for total items count
orderSchema.virtual("itemsCount").get(function () {
  return this.items?.length || 0;
});

// Ensure virtuals are included in JSON output
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export const Order = mongoose.model("Order", orderSchema);
