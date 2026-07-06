import mongoose from "mongoose";

const assessmentPageSchema = new mongoose.Schema(
  {
    assessmentTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentType",
      required: [true, "Assessment type ID is required"],
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    heroTitle: {
      type: String,
      trim: true,
      default: null,
    },
    heroDescription: {
      type: String,
      trim: true,
      default: null,
    },
    buttonText: {
      type: String,
      trim: true,
      default: "Start Assessment",
    },
    accentColor: {
      type: String,
      default: "#C9A84C",
    },
    seoTitle: {
      type: String,
      trim: true,
      default: null,
    },
    seoDescription: {
      type: String,
      trim: true,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentPageSchema.index({ assessmentTypeId: 1, displayOrder: 1 });

export const AssessmentPage = mongoose.model("AssessmentPage", assessmentPageSchema);