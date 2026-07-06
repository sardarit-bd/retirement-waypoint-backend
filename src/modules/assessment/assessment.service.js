import mongoose from "mongoose";
import { AssessmentType } from "./assessmentType.model.js";
import { AssessmentPage } from "./assessmentPage.model.js";
import { AssessmentSection } from "./assessmentSection.model.js";
import { Question } from "./question.model.js";
import { QuestionOption } from "./questionOption.model.js";
import { ResultRange } from "./resultRange.model.js";
import { Recommendation } from "./recommendation.model.js";
import { AssessmentSubmission } from "./assessmentSubmission.model.js";
import ApiError from "../../utils/ApiError.js";

class AssessmentServiceClass {
  // ==================== GENERIC HELPERS ====================
  async getPaginatedData(Model, filter, query = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "displayOrder",
      sortOrder = "asc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [data, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Model.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  // ==================== ASSESSMENT TYPE ====================
  async createAssessmentType(data) {
    const existing = await AssessmentType.findOne({ slug: data.slug });
    if (existing) {
      throw new ApiError(400, "Assessment type with this slug already exists");
    }
    return AssessmentType.create(data);
  }

  async updateAssessmentType(id, data) {
    if (data.slug) {
      const existing = await AssessmentType.findOne({
        slug: data.slug,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ApiError(400, "Assessment type with this slug already exists");
      }
    }
    return AssessmentType.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteAssessmentType(id) {
    const pages = await AssessmentPage.find({ assessmentTypeId: id });
    if (pages.length > 0) {
      throw new ApiError(400, "Cannot delete assessment type with existing pages");
    }
    return AssessmentType.findByIdAndDelete(id);
  }

  async getAssessmentTypes(query) {
    const filter = {};
    if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished === "true";
    }
    return this.getPaginatedData(AssessmentType, filter, query);
  }

  async getAssessmentTypeById(id) {
    const type = await AssessmentType.findById(id);
    if (!type) {
      throw new ApiError(404, "Assessment type not found");
    }
    return type;
  }

  // ==================== ASSESSMENT PAGE ====================
  async createAssessmentPage(data) {
    const existing = await AssessmentPage.findOne({ slug: data.slug });
    if (existing) {
      throw new ApiError(400, "Assessment page with this slug already exists");
    }
    return AssessmentPage.create(data);
  }

  async updateAssessmentPage(id, data) {
    if (data.slug) {
      const existing = await AssessmentPage.findOne({
        slug: data.slug,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ApiError(400, "Assessment page with this slug already exists");
      }
    }
    return AssessmentPage.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteAssessmentPage(id) {
    const sections = await AssessmentSection.find({ assessmentPageId: id });
    if (sections.length > 0) {
      throw new ApiError(400, "Cannot delete assessment page with existing sections");
    }
    return AssessmentPage.findByIdAndDelete(id);
  }

  async getAssessmentPages(query) {
    const filter = {};
    if (query.assessmentTypeId) filter.assessmentTypeId = query.assessmentTypeId;
    if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished === "true";
    }
    return this.getPaginatedData(AssessmentPage, filter, query);
  }

  async getAssessmentPageById(id) {
    const page = await AssessmentPage.findById(id);
    if (!page) {
      throw new ApiError(404, "Assessment page not found");
    }
    return page;
  }

  // ==================== ASSESSMENT SECTION ====================
  async createAssessmentSection(data) {
    return AssessmentSection.create(data);
  }

  async updateAssessmentSection(id, data) {
    return AssessmentSection.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteAssessmentSection(id) {
    const questions = await Question.find({ sectionId: id });
    if (questions.length > 0) {
      throw new ApiError(400, "Cannot delete section with existing questions");
    }
    return AssessmentSection.findByIdAndDelete(id);
  }

  async getAssessmentSections(query) {
    const filter = {};
    if (query.assessmentPageId) filter.assessmentPageId = query.assessmentPageId;
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    return this.getPaginatedData(AssessmentSection, filter, query);
  }

  async getAssessmentSectionById(id) {
    const section = await AssessmentSection.findById(id);
    if (!section) {
      throw new ApiError(404, "Assessment section not found");
    }
    return section;
  }

  // ==================== QUESTION ====================
  async createQuestion(data) {
    return Question.create(data);
  }

  async updateQuestion(id, data) {
    return Question.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteQuestion(id) {
    await QuestionOption.deleteMany({ questionId: id });
    return Question.findByIdAndDelete(id);
  }

  async getQuestions(query) {
    const filter = {};
    if (query.sectionId) filter.sectionId = query.sectionId;
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    return this.getPaginatedData(Question, filter, query);
  }

  async getQuestionById(id) {
    const question = await Question.findById(id);
    if (!question) {
      throw new ApiError(404, "Question not found");
    }
    return question;
  }

  // ==================== QUESTION OPTION ====================
  async createQuestionOption(data) {
    return QuestionOption.create(data);
  }

  async updateQuestionOption(id, data) {
    return QuestionOption.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteQuestionOption(id) {
    return QuestionOption.findByIdAndDelete(id);
  }

  async getQuestionOptions(questionId) {
    return QuestionOption.find({ questionId, isActive: true })
      .sort({ displayOrder: 1 });
  }

  // ==================== RESULT RANGE ====================
  async createResultRange(data) {
    return ResultRange.create(data);
  }

  async updateResultRange(id, data) {
    return ResultRange.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteResultRange(id) {
    await Recommendation.deleteMany({ resultRangeId: id });
    return ResultRange.findByIdAndDelete(id);
  }

  async getResultRanges(query) {
    const filter = {};
    if (query.assessmentPageId) filter.assessmentPageId = query.assessmentPageId;
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    return this.getPaginatedData(ResultRange, filter, query);
  }

  async getResultRangeById(id) {
    const range = await ResultRange.findById(id);
    if (!range) {
      throw new ApiError(404, "Result range not found");
    }
    return range;
  }

  async getResultRangeByScore(assessmentPageId, score) {
    return ResultRange.findOne({
      assessmentPageId,
      minScore: { $lte: score },
      maxScore: { $gte: score },
      isActive: true,
    });
  }

  // ==================== RECOMMENDATION ====================
  async createRecommendation(data) {
    return Recommendation.create(data);
  }

  async updateRecommendation(id, data) {
    return Recommendation.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteRecommendation(id) {
    return Recommendation.findByIdAndDelete(id);
  }

  async getRecommendations(resultRangeId) {
    return Recommendation.find({
      resultRangeId,
      isActive: true,
    }).sort({ priority: 1, displayOrder: 1 });
  }

  // ==================== ASSESSMENT SUBMISSION ====================
  async submitAssessment(userId, data) {
    const { assessmentPageId, answers } = data;

    // Get all sections
    const sections = await AssessmentSection.find({
      assessmentPageId,
      isActive: true,
    }).sort({ displayOrder: 1 });

    // Calculate scores
    const sectionScores = {};
    let totalScore = 0;
    let totalQuestions = 0;

    for (const section of sections) {
      const questions = await Question.find({
        sectionId: section._id,
        isActive: true,
      }).sort({ displayOrder: 1 });

      let sectionTotal = 0;
      let sectionCount = 0;

      for (const question of questions) {
        const answer = answers[question._id.toString()];
        if (answer !== undefined && answer !== null && answer !== "") {
          if (question.type === "text" || question.type === "textarea") {
            // Text answers don't contribute to score
            continue;
          }
          // Get options to find score
          if (Array.isArray(answer)) {
            // Multiple choice
            const options = await QuestionOption.find({
              questionId: question._id,
              _id: { $in: answer },
            });
            const maxScore = options.reduce((sum, opt) => sum + opt.score, 0);
            sectionTotal += maxScore;
            sectionCount++;
          } else {
            // Single choice or scale
            const option = await QuestionOption.findOne({
              questionId: question._id,
              value: answer,
            });
            if (option) {
              sectionTotal += option.score || 0;
              sectionCount++;
            }
          }
        }
      }

      const avgScore = sectionCount > 0 ? (sectionTotal / sectionCount) : 0;
      sectionScores[section.key] = Math.round(avgScore);
      totalScore += avgScore;
      totalQuestions++;
    }

    const overallScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) / 5 * 100) : 0;

    // Find result range
    const resultRange = await this.getResultRangeByScore(assessmentPageId, overallScore);
    let resultId = resultRange?._id || null;

    // Get recommendations
    let recommendations = [];
    if (resultRange) {
      recommendations = await this.getRecommendations(resultRange._id);
    }

    // Create submission
    const submission = await AssessmentSubmission.create({
      userId,
      assessmentPageId,
      answers,
      sectionScores,
      overallScore,
      resultId,
      recommendations: recommendations.map(r => r._id),
      completedAt: new Date(),
      isCompleted: true,
    });

    return {
      submission,
      resultRange,
      recommendations,
      sectionScores,
      overallScore,
    };
  }

  async getUserSubmissions(userId, query = {}) {
    const filter = { userId };
    if (query.assessmentPageId) filter.assessmentPageId = query.assessmentPageId;

    return this.getPaginatedData(AssessmentSubmission, filter, query);
  }

  async getSubmissionById(submissionId, userId) {
    const submission = await AssessmentSubmission.findById(submissionId)
      .populate("assessmentPageId")
      .populate("resultId")
      .populate("recommendations");

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    if (submission.userId !== userId) {
      throw new ApiError(403, "You don't have permission to view this submission");
    }

    return submission;
  }

  // ==================== PUBLIC API ====================
  async getPublicAssessment(slug) {
    const page = await AssessmentPage.findOne({
      slug,
      isPublished: true,
    }).populate("assessmentTypeId");

    if (!page) {
      throw new ApiError(404, "Assessment not found");
    }

    const sections = await AssessmentSection.find({
      assessmentPageId: page._id,
      isActive: true,
    }).sort({ displayOrder: 1 });

    const sectionsWithQuestions = await Promise.all(
      sections.map(async (section) => {
        const questions = await Question.find({
          sectionId: section._id,
          isActive: true,
        }).sort({ displayOrder: 1 });

        const questionsWithOptions = await Promise.all(
          questions.map(async (question) => {
            const options = await QuestionOption.find({
              questionId: question._id,
              isActive: true,
            }).sort({ displayOrder: 1 });

            return {
              ...question.toObject(),
              options,
            };
          })
        );

        return {
          ...section.toObject(),
          questions: questionsWithOptions,
        };
      })
    );

    return {
      page,
      sections: sectionsWithQuestions,
    };
  }

  async getPublicAssessmentResult(submissionId) {
    const submission = await AssessmentSubmission.findById(submissionId)
      .populate("assessmentPageId")
      .populate("resultId")
      .populate("recommendations");

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    return submission;
  }

  // ==================== ADMIN ANALYTICS ====================
  async getAssessmentAnalytics(query = {}) {
    const { assessmentPageId, dateFrom, dateTo } = query;

    const filter = {};
    if (assessmentPageId) filter.assessmentPageId = assessmentPageId;
    if (dateFrom || dateTo) {
      filter.completedAt = {};
      if (dateFrom) filter.completedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.completedAt.$lte = new Date(dateTo);
    }

    const submissions = await AssessmentSubmission.find(filter);

    const total = submissions.length;
    const completed = submissions.filter(s => s.isCompleted).length;
    const avgScore = total > 0
      ? Math.round(submissions.reduce((sum, s) => sum + s.overallScore, 0) / total)
      : 0;

    // Score distribution
    const distribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    submissions.forEach(s => {
      const score = s.overallScore;
      if (score <= 20) distribution["0-20"]++;
      else if (score <= 40) distribution["21-40"]++;
      else if (score <= 60) distribution["41-60"]++;
      else if (score <= 80) distribution["61-80"]++;
      else distribution["81-100"]++;
    });

    return {
      totalSubmissions: total,
      completedSubmissions: completed,
      averageScore: avgScore,
      scoreDistribution: distribution,
      submissions,
    };
  }
}

const AssessmentService = new AssessmentServiceClass();
export default AssessmentService;