import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: null,
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

// Compound index to prevent duplicate purchases (sparse for guest orders)
purchaseSchema.index({ userId: 1, bookId: 1 }, { unique: true, sparse: true });
purchaseSchema.index({ orderId: 1, bookId: 1 }, { unique: true });
purchaseSchema.index({ customerEmail: 1, bookId: 1 });

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