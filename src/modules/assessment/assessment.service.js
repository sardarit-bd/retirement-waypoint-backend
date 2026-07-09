import AssessmentRepository from './assessment.repository.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Generate a slug from text (only used once during creation)
 */
const generateSlug = (text) => {
  if (!text) return 'untitled';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

class AssessmentService {
  /**
   * Create a new assessment
   */
  async createAssessment(data) {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.hero?.title || 'untitled');
    }

    // Ensure slug is unique
    const slugExists = await AssessmentRepository.slugExists(data.slug);
    if (slugExists) {
      data.slug = `${data.slug}-${Date.now()}`;
    }

    // Set default status
    if (!data.status) {
      data.status = 'draft';
    }

    // Remove any deletedAt field from creation
    delete data.deletedAt;

    return await AssessmentRepository.create(data);
  }

  /**
   * Get assessment by ID (admin - includes drafts, excludes soft deleted)
   */
  async getAssessmentById(id, includeDeleted = false) {
    const assessment = await AssessmentRepository.findById(id, includeDeleted);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Get assessment by slug (admin - includes drafts, excludes soft deleted)
   */
  async getAssessmentBySlug(slug, includeDeleted = false) {
    const assessment = await AssessmentRepository.findBySlug(slug, includeDeleted);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Get published assessment by slug (public)
   */
  async getPublicAssessmentBySlug(slug) {
    const assessment = await AssessmentRepository.findPublishedBySlug(slug);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * List all assessments (admin)
   */
  async listAssessments({ page, limit, status, search, includeDeleted = false }) {
    return await AssessmentRepository.findAll({
      page,
      limit,
      status,
      search,
      includeDeleted,
    });
  }

  /**
   * List soft deleted assessments (admin)
   */
  async listDeleted({ page, limit }) {
    return await AssessmentRepository.findDeleted({ page, limit });
  }

  /**
   * List published assessments (public)
   */
  async listPublishedAssessments({ page, limit }) {
    return await AssessmentRepository.findPublished({ page, limit });
  }

  /**
   * Update assessment
   */
  async updateAssessment(id, updateData) {
    // Check if assessment exists
    const existing = await AssessmentRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Prevent slug duplication if updating slug
    if (updateData.slug) {
      // Check if slug is being changed
      if (updateData.slug !== existing.slug) {
        const slugExists = await AssessmentRepository.slugExists(updateData.slug, id);
        if (slugExists) {
          throw new ApiError(400, 'Slug already exists');
        }
      }
    }

    // NEVER auto-update slug from title - slug must remain stable

    // Remove deletedAt from update data (should not be updated directly)
    delete updateData.deletedAt;

    const assessment = await AssessmentRepository.updateById(id, updateData);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Soft delete assessment
   */
  async deleteAssessment(id, deletedBy = null) {
    const assessment = await AssessmentRepository.softDeleteById(id, deletedBy);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Restore a soft deleted assessment
   */
  async restoreAssessment(id) {
    const assessment = await AssessmentRepository.restoreById(id);
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Hard delete assessment (use with caution - only for cleanup)
   */
  async hardDeleteAssessment(id) {
    // Check if assessment exists
    const existing = await AssessmentRepository.findById(id, true);
    if (!existing) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Check if assessment has submissions (prevent orphaned data)
    // This will be implemented when Submission module is added

    return await AssessmentRepository.hardDeleteById(id);
  }

  /**
   * Duplicate assessment
   */
  async duplicateAssessment(id) {
    const original = await AssessmentRepository.findById(id);
    if (!original) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Convert to plain object and remove id and timestamps
    const duplicate = { ...original };
    delete duplicate._id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;
    delete duplicate.__v;
    delete duplicate.deletedAt;
    delete duplicate.deletedBy;

    // Generate new slug
    const baseSlug = `${original.slug}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await AssessmentRepository.slugExists(newSlug)) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    duplicate.slug = newSlug;
    duplicate.status = 'draft';

    // Add " (Copy)" to title
    duplicate.hero.title = `${duplicate.hero.title} (Copy)`;
    duplicate.introduction.title = `${duplicate.introduction.title} (Copy)`;

    return await AssessmentRepository.create(duplicate);
  }

  /**
   * Publish assessment
   */
  async publishAssessment(id) {
    const assessment = await AssessmentRepository.updateById(id, {
      status: 'published',
    });
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Archive assessment
   */
  async archiveAssessment(id) {
    const assessment = await AssessmentRepository.updateById(id, {
      status: 'archived',
    });
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }
    return assessment;
  }

  /**
   * Get assessment statistics
   */
  async getStats() {
    return await AssessmentRepository.getStats();
  }

  /**
   * Get status counts
   */
  async getStatusCounts() {
    return await AssessmentRepository.countByStatus();
  }
}

export default new AssessmentService();