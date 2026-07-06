import mongoose from "mongoose";

const resultRangeSchema = new mongoose.Schema(
  {
    assessmentPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentPage",
      required: [true, "Assessment page ID is required"],
      index: true,
    },
    minScore: {
      type: Number,
      required: [true, "Minimum score is required"],
      min: 0,
      max: 100,
    },
    maxScore: {
      type: Number,
      required: [true, "Maximum score is required"],
      min: 0,
      max: 100,
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
    color: {
      type: String,
      default: "#C9A84C",
    },
    image: {
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

resultRangeSchema.index({ assessmentPageId: 1, minScore: 1, maxScore: 1 });

export const ResultRange = mongoose.model("ResultRange", resultRangeSchema);