import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    accessStatus: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate purchases
purchaseSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Compound index for user purchases
purchaseSchema.index({ userId: 1, purchasedAt: -1 });

// Virtual for checking if user has access
purchaseSchema.virtual("hasAccess").get(function () {
  return this.accessStatus === "ACTIVE";
});

// Ensure virtuals are included in JSON output
purchaseSchema.set("toJSON", { virtuals: true });
purchaseSchema.set("toObject", { virtuals: true });

export const Purchase = mongoose.model("Purchase", purchaseSchema);