import AssessmentRepository from '../assessment/assessment.repository.js';
import AssessmentSubmissionRepository from './assessment-submission.repository.js';
import {
  calculateDomainScores,
  calculateOverallScore,
  findResultRange,
  validateAnswers,
  generateRecommendations,
} from '../../utils/result-calculator.js';
import ApiError from '../../utils/ApiError.js';

class AssessmentSubmissionService {
  /**
   * Submit an assessment
   */
  async submitAssessment(slug, submissionData) {
    // 1. Load assessment
    const assessment = await AssessmentRepository.findPublishedBySlug(slug);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    // 2. Validate answers against assessment questions
    const validationErrors = validateAnswers(assessment.domains, submissionData.answers);
    if (validationErrors.length > 0) {
      throw new ApiError(400, `Validation failed: ${validationErrors.join('; ')}`);
    }

    // 3. Calculate domain scores
    const domainScores = calculateDomainScores(assessment.domains, submissionData.answers);

    // 4. Calculate overall score
    const overallScore = calculateOverallScore(domainScores);

    // 5. Find matching result range
    const resultRange = findResultRange(assessment.results.ranges, overallScore);
    if (!resultRange) {
      throw new ApiError(400, 'No matching result range found for the calculated score');
    }

    // 6. Generate recommendations
    const recommendations = generateRecommendations(resultRange);

    // 7. Prepare submission data
    const submission = {
      assessmentId: assessment._id,
      assessmentSlug: assessment.slug,
      participant: {
        name: submissionData.participant.name.trim(),
        email: submissionData.participant.email.toLowerCase().trim(),
      },
      userId: submissionData.userId || null,
      answers: submissionData.answers,
      reflections: submissionData.reflections || [],
      domainScores,
      overallScore,
      resultRange: {
        title: resultRange.title,
        description: resultRange.description,
        color: resultRange.color,
      },
      recommendations,
      completedAt: new Date(),
    };

    // 8. Save submission
    const savedSubmission = await AssessmentSubmissionRepository.create(submission);

    // 9. Prepare response
    return {
      submissionId: savedSubmission._id,
      assessmentId: assessment._id,
      assessmentSlug: assessment.slug,
      participant: savedSubmission.participant,
      overallScore,
      domainScores,
      resultRange: {
        title: resultRange.title,
        description: resultRange.description,
        color: resultRange.color,
      },
      recommendations,
      completedAt: savedSubmission.completedAt,
    };
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id) {
    const submission = await AssessmentSubmissionRepository.findById(id);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }
    return submission;
  }

  /**
   * Get submissions by email
   */
  async getSubmissionsByEmail(email, query = {}) {
    const result = await AssessmentSubmissionRepository.findByEmail(email, query);
    if (result.submissions.length === 0) {
      throw new ApiError(404, 'No submissions found for this email');
    }
    return result;
  }

  /**
   * Get submissions by assessment
   */
  async getSubmissionsByAssessment(assessmentId, query = {}) {
    const result = await AssessmentSubmissionRepository.findByAssessment(assessmentId, query);
    if (result.submissions.length === 0) {
      throw new ApiError(404, 'No submissions found for this assessment');
    }
    return result;
  }

  /**
   * Get latest submission by email and assessment
   */
  async getLatestSubmissionByEmailAndAssessment(email, assessmentId) {
    const submission = await AssessmentSubmissionRepository.findLatestByEmailAndAssessment(
      email,
      assessmentId
    );
    if (!submission) {
      throw new ApiError(404, 'No submission found');
    }
    return submission;
  }

  /**
   * Get submission statistics
   */
  async getStats() {
    return await AssessmentSubmissionRepository.getStats();
  }

  /**
   * Get participants with filters (admin)
   */
  async getParticipants(query = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      assessmentSlug,
      resultRange,
      sortBy = 'newest',
      dateFrom,
      dateTo,
    } = query;

    const result = await AssessmentSubmissionRepository.findParticipants({
      page,
      limit,
      search,
      assessmentSlug,
      resultRange,
      sortBy,
      dateFrom,
      dateTo,
    });

    return result;
  }

  /**
   * Get participant stats (admin)
   */
  async getParticipantStats() {
    return await AssessmentSubmissionRepository.getParticipantStats();
  }

}

export default new AssessmentSubmissionService();