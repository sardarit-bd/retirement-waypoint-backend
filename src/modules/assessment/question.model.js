import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSection",
      required: [true, "Section ID is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["single_choice", "multiple_choice", "scale_1_to_5", "yes_no", "text", "textarea"],
      required: [true, "Question type is required"],
      default: "single_choice",
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
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

questionSchema.index({ sectionId: 1, displayOrder: 1 });

export const Question = mongoose.model("Question", questionSchema);