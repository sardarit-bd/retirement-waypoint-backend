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
      .populate('assessmentId', 'slug hero introduction domains')
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

  /**
 * Find participants with filters (admin)
 */
  async findParticipants({
    page = 1,
    limit = 10,
    search,
    assessmentSlug,
    resultRange,
    sortBy = 'newest',
    dateFrom,
    dateTo,
  } = {}) {
    const query = {};

    // Search by name or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { 'participant.name': searchRegex },
        { 'participant.email': searchRegex },
      ];
    }

    // Filter by assessment
    if (assessmentSlug) {
      query.assessmentSlug = assessmentSlug;
    }

    // Filter by result range
    if (resultRange) {
      query['resultRange.title'] = resultRange;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.completedAt = {};
      if (dateFrom) {
        query.completedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.completedAt.$lte = new Date(dateTo);
      }
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { completedAt: -1 };
        break;
      case 'oldest':
        sort = { completedAt: 1 };
        break;
      case 'highestScore':
        sort = { overallScore: -1 };
        break;
      case 'lowestScore':
        sort = { overallScore: 1 };
        break;
      case 'nameAZ':
        sort = { 'participant.name': 1 };
        break;
      case 'nameZA':
        sort = { 'participant.name': -1 };
        break;
      default:
        sort = { completedAt: -1 };
    }

    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Get distinct assessments for filter options
    const assessmentSlugs = await AssessmentSubmission.distinct('assessmentSlug', {});

    const [submissions, total] = await Promise.all([
      AssessmentSubmission.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assessmentId', 'slug hero title')
        .lean(),
      AssessmentSubmission.countDocuments(query),
    ]);

    // Get result range options
    const resultRanges = await AssessmentSubmission.distinct('resultRange.title', {});

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
      filters: {
        assessmentSlugs,
        resultRanges,
      },
    };
  }

  /**
   * Get participant stats (admin)
   */
  async getParticipantStats() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, uniqueEmails, today, thisMonth] = await Promise.all([
      AssessmentSubmission.countDocuments(),
      AssessmentSubmission.distinct('participant.email').then(emails => emails.length),
      AssessmentSubmission.countDocuments({
        completedAt: { $gte: startOfDay },
      }),
      AssessmentSubmission.countDocuments({
        completedAt: { $gte: startOfMonth },
      }),
    ]);

    // Get submissions by assessment
    const byAssessment = await AssessmentSubmission.aggregate([
      {
        $group: {
          _id: '$assessmentSlug',
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get submissions by result range
    const byResultRange = await AssessmentSubmission.aggregate([
      {
        $group: {
          _id: '$resultRange.title',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubmissions = await AssessmentSubmission.find({
      completedAt: { $gte: sevenDaysAgo },
    })
      .sort({ completedAt: -1 })
      .limit(7)
      .select('participant assessmentSlug overallScore completedAt')
      .lean();

    return {
      total,
      uniqueEmails,
      today,
      thisMonth,
      byAssessment,
      byResultRange,
      recentSubmissions,
    };
  }
}

export default new AssessmentSubmissionRepository();