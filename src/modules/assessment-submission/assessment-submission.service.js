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

    const ASSESSMENT_TYPE_MAP = {
      'pre-retiree': 1,
      'recent-retiree': 2,
      'established-retiree': 3,
    };

    const baseHeaders = [
      'Assessment Type',
      'User Name',
      'User Email',
      'Submission Date',
    ];

    // 1. Determine dynamic columns across all submissions being exported
    const dynamicHeadersSet = [];

    for (const submission of submissions) {
      const assessment = submission.assessmentId || {};
      const domains = assessment.domains || [];

      let qIndex = 1;
      let cIndex = 1;

      for (const domain of domains) {
        const questions = domain.questions || [];
        for (let i = 0; i < questions.length; i++) {
          const qKey = `Q${qIndex}`;
          if (!dynamicHeadersSet.includes(qKey)) {
            dynamicHeadersSet.push(qKey);
          }
          qIndex++;
        }
        const cKey = `COMMENT${cIndex}`;
        if (!dynamicHeadersSet.includes(cKey)) {
          dynamicHeadersSet.push(cKey);
        }
        cIndex++;
      }
    }

    // Default fallback to at least Q1-Q15 and COMMENT1-COMMENT5 if no submissions had domain metadata
    if (dynamicHeadersSet.length === 0) {
      for (let i = 1; i <= 15; i++) {
        dynamicHeadersSet.push(`Q${i}`);
        if (i % 3 === 0) {
          dynamicHeadersSet.push(`COMMENT${i / 3}`);
        }
      }
    }

    const exportHeaders = [...baseHeaders, ...dynamicHeadersSet];

    // 2. Build rows dynamically
    for (const submission of submissions) {
      const assessment = submission.assessmentId || {};
      const slug = submission.assessmentSlug || assessment.slug;
      const assessmentType =
        slug && ASSESSMENT_TYPE_MAP[slug] !== undefined
          ? ASSESSMENT_TYPE_MAP[slug]
          : slug || '';

      const answerByQuestionId = {};
      for (const answer of submission.answers || []) {
        if (answer?.questionId) {
          answerByQuestionId[answer.questionId] = answer;
        }
      }

      const reflectionByDomainId = {};
      const reflectionByDomainKey = {};
      for (const reflection of submission.reflections || []) {
        if (reflection?.domainId) {
          reflectionByDomainId[reflection.domainId] = reflection;
        }
        if (reflection?.domainKey) {
          reflectionByDomainKey[reflection.domainKey] = reflection;
        }
      }

      const row = {
        'Assessment Type': assessmentType,
        'User Name': submission.participant?.name || '',
        'User Email': submission.participant?.email || '',
        'Submission Date': submission.completedAt
          ? new Date(submission.completedAt).toISOString()
          : '',
      };

      // Initialize all dynamic columns with empty string
      for (const header of dynamicHeadersSet) {
        row[header] = '';
      }

      let qCounter = 1;
      let cCounter = 1;

      const domains = assessment.domains || [];
      if (domains.length > 0) {
        for (const domain of domains) {
          for (const question of domain.questions || []) {
            const answer = answerByQuestionId[question.id];
            const qKey = `Q${qCounter}`;
            if (answer && answer.score !== undefined && answer.score !== null) {
              row[qKey] = answer.score;
            } else if (answer && answer.value !== undefined && answer.value !== null) {
              row[qKey] = answer.value;
            }
            qCounter++;
          }

          const reflection =
            reflectionByDomainId[domain.id] ||
            reflectionByDomainKey[domain.key] ||
            (submission.reflections && submission.reflections[cCounter - 1]);
          const cKey = `COMMENT${cCounter}`;
          row[cKey] = reflection?.answer || '';
          cCounter++;
        }
      } else {
        (submission.answers || []).forEach((ans, idx) => {
          const qKey = `Q${idx + 1}`;
          row[qKey] = ans.score ?? ans.value ?? '';
        });
        (submission.reflections || []).forEach((ref, idx) => {
          const cKey = `COMMENT${idx + 1}`;
          row[cKey] = ref.answer || '';
        });
      }

      rows.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: exportHeaders });
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
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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