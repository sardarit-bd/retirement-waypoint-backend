import mongoose from "mongoose";

const questionOptionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
      index: true,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
    },
    score: {
      type: Number,
      default: 0,
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

questionOptionSchema.index({ questionId: 1, displayOrder: 1 });

export const QuestionOption = mongoose.model("QuestionOption", questionOptionSchema);