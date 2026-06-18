import mongoose from "mongoose";

const assessmentSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    assessmentPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentPage",
      required: [true, "Assessment page ID is required"],
      index: true,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sectionScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResultRange",
      default: null,
    },
    recommendations: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Recommendation",
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSubmissionSchema.index({ userId: 1, completedAt: -1 });
assessmentSubmissionSchema.index({ assessmentPageId: 1, completedAt: -1 });

export const AssessmentSubmission = mongoose.model("AssessmentSubmission", assessmentSubmissionSchema);