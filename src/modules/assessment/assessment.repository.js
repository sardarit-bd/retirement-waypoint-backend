import Assessment from './assessment.model.js';

class AssessmentRepository {
  /**
   * Build base query filter (excludes soft deleted)
   */
  getBaseFilter(includeDeleted = false) {
    return includeDeleted ? {} : { deletedAt: null };
  }

  /**
   * Create a new assessment
   */
  async create(assessmentData) {
    return await Assessment.create(assessmentData);
  }

  /**
   * Find assessment by ID
   */
  async findById(id, includeDeleted = false) {
    const filter = { _id: id, ...this.getBaseFilter(includeDeleted) };
    return await Assessment.findOne(filter).lean();
  }

  /**
   * Find assessment by slug
   */
  async findBySlug(slug, includeDeleted = false) {
    const filter = { slug, ...this.getBaseFilter(includeDeleted) };
    return await Assessment.findOne(filter).lean();
  }

  /**
   * Find assessment by slug (public - only published, not deleted)
   */
  async findPublishedBySlug(slug) {
    return await Assessment.findOne({
      slug,
      status: 'published',
      deletedAt: null,
    }).lean();
  }

  /**
   * Get all assessments with pagination and filtering (admin)
   */
  async findAll({ page = 1, limit = 10, status, search, includeDeleted = false } = {}) {
    const query = this.getBaseFilter(includeDeleted);
    
    if (status) {
      query.status = status;
    }
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { 'hero.title': searchRegex },
        { slug: searchRegex },
        { 'hero.subtitle': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Assessment.countDocuments(query),
    ]);

    return {
      assessments,
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
   * Get all published assessments (public)
   */
  async findPublished({ page = 1, limit = 10 } = {}) {
    const query = {
      status: 'published',
      deletedAt: null,
    };

    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('slug hero status createdAt updatedAt')
        .lean(),
      Assessment.countDocuments(query),
    ]);

    return {
      assessments,
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
   * Get soft deleted assessments (admin)
   */
  async findDeleted({ page = 1, limit = 10 } = {}) {
    const query = { deletedAt: { $ne: null } };
    const skip = (page - 1) * limit;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Assessment.countDocuments(query),
    ]);

    return {
      assessments,
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
   * Update an assessment by ID
   */
  async updateById(id, updateData) {
    return await Assessment.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Soft delete an assessment by ID
   */
  async softDeleteById(id, deletedBy = null) {
    return await Assessment.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();
  }

  /**
   * Restore a soft deleted assessment by ID
   */
  async restoreById(id) {
    return await Assessment.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();
  }

  /**
   * Hard delete an assessment by ID (use with caution)
   */
  async hardDeleteById(id) {
    return await Assessment.findByIdAndDelete(id);
  }

  /**
   * Check if slug exists (excluding soft deleted)
   */
  async slugExists(slug, excludeId = null) {
    const query = { slug, deletedAt: null };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return await Assessment.exists(query);
  }

  /**
   * Count assessments by status
   */
  async countByStatus() {
    return await Assessment.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * Get assessment statistics (excluding soft deleted)
   */
  async getStats() {
    const [total, published, draft, archived, deleted] = await Promise.all([
      Assessment.countDocuments({ deletedAt: null }),
      Assessment.countDocuments({ status: 'published', deletedAt: null }),
      Assessment.countDocuments({ status: 'draft', deletedAt: null }),
      Assessment.countDocuments({ status: 'archived', deletedAt: null }),
      Assessment.countDocuments({ deletedAt: { $ne: null } }),
    ]);

    return { total, published, draft, archived, deleted };
  }
}

export default new AssessmentRepository();