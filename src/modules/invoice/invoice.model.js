import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["ISSUED", "PAID", "REFUNDED"],
      default: "ISSUED",
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    pdfPublicId: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
invoiceSchema.index({ userId: 1, issuedAt: -1 });
invoiceSchema.index({ orderId: 1 }, { unique: true });
invoiceSchema.index({ status: 1, issuedAt: -1 });

// Virtual for invoice items (populated from Order)
invoiceSchema.virtual("items", {
  ref: "OrderItem",
  localField: "orderId",
  foreignField: "orderId",
});

// Ensure virtuals are included
invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);