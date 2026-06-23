import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true,
    },
    bookId: {
      type: String,
      required: [true, "Book ID is required"],
      index: true,
    },
    bookTitle: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    bookCoverImage: {
      type: String,
      default: null
    },
    bookPrice: {
      type: Number,
      required: [true, "Book price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for order lookups
orderItemSchema.index({ orderId: 1, bookId: 1 });

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);