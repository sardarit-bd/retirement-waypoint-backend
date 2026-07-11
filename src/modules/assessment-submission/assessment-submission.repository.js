import { AssessmentSubmission } from "./assessmentSubmission.model.js";


class AssessmentSubmissionRepository {
  /**
   * Create a new submission
   */
  async create(submissionData) {
    return await AssessmentSubmission.create(submissionData);
  }

  /**
   * Find submission by ID
   */
  async findById(id) {
    return await AssessmentSubmission.findById(id)
      .populate('assessmentId', 'slug hero introduction')
      .lean();
  }

  /**
   * Find submissions by email
   */
  async findByEmail(email, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const query = { 'participant.email': email.toLowerCase().trim() };

    const [submissions, total] = await Promise.all([
      AssessmentSubmission.find(query)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assessmentId', 'slug hero introduction')
        .lean(),
      AssessmentSubmission.countDocuments(query),
    ]);

    return {
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Find submissions by assessment
   */
  async findByAssessment(assessmentId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const query = { assessmentId };

    const [submissions, total] = await Promise.all([
      AssessmentSubmission.find(query)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AssessmentSubmission.countDocuments(query),
    ]);

    return {
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Find latest submission by email and assessment
   */
  async findLatestByEmailAndAssessment(email, assessmentId) {
    return await AssessmentSubmission.findOne({
      'participant.email': email.toLowerCase().trim(),
      assessmentId,
    })
      .sort({ completedAt: -1 })
      .populate('assessmentId', 'slug hero introduction')
      .lean();
  }

  /**
   * Get submission statistics
   */
  async getStats() {
    const [total, uniqueParticipants, byAssessment] = await Promise.all([
      AssessmentSubmission.countDocuments(),
      AssessmentSubmission.distinct('participant.email').then(emails => emails.length),
      AssessmentSubmission.aggregate([
        {
          $group: {
            _id: '$assessmentSlug',
            count: { $sum: 1 },
            avgScore: { $avg: '$overallScore' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { total, uniqueParticipants, byAssessment };
  }
}

export default new AssessmentSubmissionRepository();