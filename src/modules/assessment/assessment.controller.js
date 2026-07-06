import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import AssessmentService from "./assessment.service.js";
import ApiError from "../../utils/ApiError.js";

// ==================== ASSESSMENT TYPE ====================
const createAssessmentType = catchAsync(async (req, res) => {
  const type = await AssessmentService.createAssessmentType(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Assessment type created", data: type });
});

const updateAssessmentType = catchAsync(async (req, res) => {
  const type = await AssessmentService.updateAssessmentType(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment type updated", data: type });
});

const deleteAssessmentType = catchAsync(async (req, res) => {
  await AssessmentService.deleteAssessmentType(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment type deleted", data: null });
});

const getAssessmentTypes = catchAsync(async (req, res) => {
  const result = await AssessmentService.getAssessmentTypes(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment types retrieved", data: result.data, meta: result.pagination });
});

const getAssessmentTypeById = catchAsync(async (req, res) => {
  const type = await AssessmentService.getAssessmentTypeById(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment type retrieved", data: type });
});

// ==================== ASSESSMENT PAGE ====================
const createAssessmentPage = catchAsync(async (req, res) => {
  const page = await AssessmentService.createAssessmentPage(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Assessment page created", data: page });
});

const updateAssessmentPage = catchAsync(async (req, res) => {
  const page = await AssessmentService.updateAssessmentPage(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment page updated", data: page });
});

const deleteAssessmentPage = catchAsync(async (req, res) => {
  await AssessmentService.deleteAssessmentPage(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment page deleted", data: null });
});

const getAssessmentPages = catchAsync(async (req, res) => {
  const result = await AssessmentService.getAssessmentPages(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment pages retrieved", data: result.data, meta: result.pagination });
});

const getAssessmentPageById = catchAsync(async (req, res) => {
  const page = await AssessmentService.getAssessmentPageById(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment page retrieved", data: page });
});

// ==================== ASSESSMENT SECTION ====================
const createAssessmentSection = catchAsync(async (req, res) => {
  const section = await AssessmentService.createAssessmentSection(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Assessment section created", data: section });
});

const updateAssessmentSection = catchAsync(async (req, res) => {
  const section = await AssessmentService.updateAssessmentSection(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment section updated", data: section });
});

const deleteAssessmentSection = catchAsync(async (req, res) => {
  await AssessmentService.deleteAssessmentSection(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment section deleted", data: null });
});

const getAssessmentSections = catchAsync(async (req, res) => {
  const result = await AssessmentService.getAssessmentSections(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment sections retrieved", data: result.data, meta: result.pagination });
});

const getAssessmentSectionById = catchAsync(async (req, res) => {
  const section = await AssessmentService.getAssessmentSectionById(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment section retrieved", data: section });
});

// ==================== QUESTION ====================
const createQuestion = catchAsync(async (req, res) => {
  const question = await AssessmentService.createQuestion(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Question created", data: question });
});

const updateQuestion = catchAsync(async (req, res) => {
  const question = await AssessmentService.updateQuestion(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Question updated", data: question });
});

const deleteQuestion = catchAsync(async (req, res) => {
  await AssessmentService.deleteQuestion(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Question deleted", data: null });
});

const getQuestions = catchAsync(async (req, res) => {
  const result = await AssessmentService.getQuestions(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Questions retrieved", data: result.data, meta: result.pagination });
});

const getQuestionById = catchAsync(async (req, res) => {
  const question = await AssessmentService.getQuestionById(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Question retrieved", data: question });
});

// ==================== QUESTION OPTION ====================
const createQuestionOption = catchAsync(async (req, res) => {
  const option = await AssessmentService.createQuestionOption(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Question option created", data: option });
});

const updateQuestionOption = catchAsync(async (req, res) => {
  const option = await AssessmentService.updateQuestionOption(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Question option updated", data: option });
});

const deleteQuestionOption = catchAsync(async (req, res) => {
  await AssessmentService.deleteQuestionOption(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Question option deleted", data: null });
});

const getQuestionOptions = catchAsync(async (req, res) => {
  const options = await AssessmentService.getQuestionOptions(req.params.questionId);
  sendResponse(res, { success: true, statusCode: 200, message: "Question options retrieved", data: options });
});

// ==================== RESULT RANGE ====================
const createResultRange = catchAsync(async (req, res) => {
  const range = await AssessmentService.createResultRange(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Result range created", data: range });
});

const updateResultRange = catchAsync(async (req, res) => {
  const range = await AssessmentService.updateResultRange(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Result range updated", data: range });
});

const deleteResultRange = catchAsync(async (req, res) => {
  await AssessmentService.deleteResultRange(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Result range deleted", data: null });
});

const getResultRanges = catchAsync(async (req, res) => {
  const result = await AssessmentService.getResultRanges(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Result ranges retrieved", data: result.data, meta: result.pagination });
});

const getResultRangeById = catchAsync(async (req, res) => {
  const range = await AssessmentService.getResultRangeById(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Result range retrieved", data: range });
});

// ==================== RECOMMENDATION ====================
const createRecommendation = catchAsync(async (req, res) => {
  const rec = await AssessmentService.createRecommendation(req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Recommendation created", data: rec });
});

const updateRecommendation = catchAsync(async (req, res) => {
  const rec = await AssessmentService.updateRecommendation(req.params.id, req.body);
  sendResponse(res, { success: true, statusCode: 200, message: "Recommendation updated", data: rec });
});

const deleteRecommendation = catchAsync(async (req, res) => {
  await AssessmentService.deleteRecommendation(req.params.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Recommendation deleted", data: null });
});

const getRecommendations = catchAsync(async (req, res) => {
  const recommendations = await AssessmentService.getRecommendations(req.params.resultRangeId);
  sendResponse(res, { success: true, statusCode: 200, message: "Recommendations retrieved", data: recommendations });
});

// ==================== SUBMISSION ====================
const submitAssessment = catchAsync(async (req, res) => {
  const result = await AssessmentService.submitAssessment(req.user.id, req.body);
  sendResponse(res, { success: true, statusCode: 201, message: "Assessment submitted successfully", data: result });
});

const getUserSubmissions = catchAsync(async (req, res) => {
  const result = await AssessmentService.getUserSubmissions(req.user.id, req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Submissions retrieved", data: result.data, meta: result.pagination });
});

const getSubmissionById = catchAsync(async (req, res) => {
  const submission = await AssessmentService.getSubmissionById(req.params.id, req.user.id);
  sendResponse(res, { success: true, statusCode: 200, message: "Submission retrieved", data: submission });
});

// ==================== ADMIN SUBMISSIONS ====================
const adminGetSubmissions = catchAsync(async (req, res) => {
  const result = await AssessmentService.getUserSubmissions(null, req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Submissions retrieved", data: result.data, meta: result.pagination });
});

const adminGetSubmissionById = catchAsync(async (req, res) => {
  const submission = await AssessmentService.getSubmissionById(req.params.id, null);
  sendResponse(res, { success: true, statusCode: 200, message: "Submission retrieved", data: submission });
});

// ==================== PUBLIC ====================
const getPublicAssessment = catchAsync(async (req, res) => {
  const data = await AssessmentService.getPublicAssessment(req.params.slug);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment retrieved", data });
});

const getPublicAssessmentResult = catchAsync(async (req, res) => {
  const result = await AssessmentService.getPublicAssessmentResult(req.params.submissionId);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment result retrieved", data: result });
});

// ==================== ANALYTICS ====================
const getAssessmentAnalytics = catchAsync(async (req, res) => {
  const data = await AssessmentService.getAssessmentAnalytics(req.validatedQuery || req.query);
  sendResponse(res, { success: true, statusCode: 200, message: "Assessment analytics retrieved", data });
});

export const AssessmentController = {
  // Assessment Type
  createAssessmentType,
  updateAssessmentType,
  deleteAssessmentType,
  getAssessmentTypes,
  getAssessmentTypeById,

  // Assessment Page
  createAssessmentPage,
  updateAssessmentPage,
  deleteAssessmentPage,
  getAssessmentPages,
  getAssessmentPageById,

  // Assessment Section
  createAssessmentSection,
  updateAssessmentSection,
  deleteAssessmentSection,
  getAssessmentSections,
  getAssessmentSectionById,

  // Question
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  getQuestionById,

  // Question Option
  createQuestionOption,
  updateQuestionOption,
  deleteQuestionOption,
  getQuestionOptions,

  // Result Range
  createResultRange,
  updateResultRange,
  deleteResultRange,
  getResultRanges,
  getResultRangeById,

  // Recommendation
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  getRecommendations,

  // Submission
  submitAssessment,
  getUserSubmissions,
  getSubmissionById,

  // Admin Submissions
  adminGetSubmissions,
  adminGetSubmissionById,

  // Public
  getPublicAssessment,
  getPublicAssessmentResult,

  // Analytics
  getAssessmentAnalytics,
};