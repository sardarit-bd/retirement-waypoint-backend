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
import XLSX from 'xlsx';

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

    // 7. Fetch previous submission for comparison (before saving new one)
    const now = new Date();
    const participantEmail = (submissionData.participant?.email || '').toLowerCase().trim();
    const previousSubmission = participantEmail
      ? await AssessmentSubmissionRepository.findPreviousByEmailAndAssessment(
          participantEmail,
          assessment._id,
          now
        )
      : null;

    // 8. Prepare submission data
    const submission = {
      assessmentId: assessment._id,
      assessmentSlug: assessment.slug,
      participant: {
        name: submissionData.participant.name.trim(),
        email: participantEmail,
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
      completedAt: now,
    };

    // 9. Save submission
    const savedSubmission = await AssessmentSubmissionRepository.create(submission);

    // 10. Prepare response with comparison data
    const response = {
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

    if (previousSubmission) {
      const scoreChange = overallScore - previousSubmission.overallScore;
      response.previousSubmission = {
        overallScore: previousSubmission.overallScore,
        domainScores: previousSubmission.domainScores,
        completedAt: previousSubmission.completedAt,
        scoreChange,
        scoreChangeDirection: scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'unchanged',
      };
    }

    return response;
  }

  /**
   * Get submission by ID with previous submission comparison
   */
  async getSubmissionById(id) {
    const submission = await AssessmentSubmissionRepository.findById(id);
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    // Fetch previous submission for comparison
    const previousSubmission = await AssessmentSubmissionRepository.findPreviousByEmailAndAssessment(
      submission.participant.email,
      submission.assessmentId,
      submission.completedAt
    );

    const result = { ...submission };

    if (previousSubmission) {
      const scoreChange = submission.overallScore - previousSubmission.overallScore;
      result.previousSubmission = {
        overallScore: previousSubmission.overallScore,
        domainScores: previousSubmission.domainScores,
        completedAt: previousSubmission.completedAt,
        scoreChange,
        scoreChangeDirection: scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'unchanged',
      };
    }

    return result;
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
   * Get participants grouped by email with filters (admin)
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

    const result = await AssessmentSubmissionRepository.findParticipantsGrouped({
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
   * Get participant history by email
   */
  async getParticipantHistory(email) {
    const submissions = await AssessmentSubmissionRepository.findByEmailAll(email);
    if (submissions.length === 0) {
      throw new ApiError(404, 'No submissions found for this participant');
    }

    // Add score comparison between consecutive attempts (newest first)
    const history = submissions.map((sub, index) => {
      const prevSub = submissions[index + 1]; // next in sorted order = older
      let scoreChange = null;
      let scoreChangeDirection = null;
      if (prevSub) {
        scoreChange = sub.overallScore - prevSub.overallScore;
        scoreChangeDirection = scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'unchanged';
      }
      return {
        ...sub,
        scoreChange,
        scoreChangeDirection,
      };
    });

    return {
      participant: submissions[0].participant,
      totalAttempts: submissions.length,
      history,
    };
  }

  /**
   * Export submission responses (admin)
   */
  async exportParticipants(query = {}) {
    const submissions = await AssessmentSubmissionRepository.findForExport(query);
    const rows = [];

    for (const submission of submissions) {
      const assessment = submission.assessmentId || {};
      const questionInfoById = {};
      const domainInfoById = {};

      for (const domain of assessment.domains || []) {
        domainInfoById[domain.id] = domain;
        for (const question of domain.questions || []) {
          questionInfoById[question.id] = question;
        }
      }

      const row = {
        'Assessment Name': assessment.hero?.title || assessment.introduction?.title || '',
        'Assessment Type': assessment.introduction?.badge || '',
        'Assessment Slug': submission.assessmentSlug || assessment.slug || '',
        'User Name': submission.participant?.name || '',
        'User Email': submission.participant?.email || '',
        'Submission Date': submission.completedAt ? new Date(submission.completedAt).toISOString() : '',
        'Score': submission.overallScore ?? '',
        'Result': submission.resultRange?.title || '',
        'Result Description': submission.resultRange?.description || '',
      };

      for (const answer of submission.answers || []) {
        const question = questionInfoById[answer.questionId];
        const label = question?.text || answer.questionId;
        const option = question?.options?.find((item) => item.value === answer.value);
        row[`Answer: ${label}`] = option?.label || answer.value;
        row[`Answer Score: ${label}`] = answer.score ?? '';
      }

      for (const reflection of submission.reflections || []) {
        const label = reflection.question || reflection.domainId;
        row[`Reflection: ${label}`] = reflection.answer || '';
      }

      for (const domainScore of submission.domainScores || []) {
        const domain = domainInfoById[domainScore.domainId];
        const label = domain?.label || domainScore.domainLabel || domainScore.domainKey || domainScore.domainId;
        row[`Domain Score: ${label}`] = domainScore.score ?? '';
        row[`Domain Percentage: ${label}`] = domainScore.percentage ?? '';
      }

      rows.push(row);
    }

    const baseHeaders = [
      'Assessment Name',
      'Assessment Type',
      'Assessment Slug',
      'User Name',
      'User Email',
      'Submission Date',
      'Score',
      'Result',
      'Result Description',
    ];
    const headers = [...baseHeaders];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!headers.includes(key)) headers.push(key);
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Responses');
    const format = query.format || 'xlsx';

    if (format === 'csv') {
      return {
        buffer: Buffer.from(XLSX.utils.sheet_to_csv(worksheet), 'utf8'),
        contentType: 'text/csv; charset=utf-8',
        filename: `assessment-responses-${new Date().toISOString().slice(0, 10)}.csv`,
      };
    }

    return {
      buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `assessment-responses-${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }

  /**
   * Get participant stats (admin)
   */
  async getParticipantStats() {
    return await AssessmentSubmissionRepository.getParticipantStats();
  }

}

export default new AssessmentSubmissionService();