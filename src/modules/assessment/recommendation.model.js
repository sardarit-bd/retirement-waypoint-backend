import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    resultRangeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResultRange",
      required: [true, "Result range ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    bookIds: {
      type: [String],
      default: [],
    },
    resourceLinks: {
      type: [String],
      default: [],
    },
    ctaText: {
      type: String,
      default: "Learn More",
    },
    ctaLink: {
      type: String,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Recommendation = mongoose.model("Recommendation", recommendationSchema);