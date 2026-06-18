import mongoose from "mongoose";

const assessmentSectionSchema = new mongoose.Schema(
  {
    assessmentPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentPage",
      required: [true, "Assessment page ID is required"],
      index: true,
    },
    key: {
      type: String,
      required: [true, "Key is required"],
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    color: {
      type: String,
      default: "#534AB7",
    },
    openQuestion: {
      type: String,
      trim: true,
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSectionSchema.index({ assessmentPageId: 1, displayOrder: 1 });

export const AssessmentSection = mongoose.model("AssessmentSection", assessmentSectionSchema);