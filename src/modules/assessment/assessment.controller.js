import AssessmentService from './assessment.service.js';
import sendResponse from '../../utils/sendResponse.js';

class AssessmentController {
  /**
   * Create a new assessment
   */
  async create(req, res, next) {
    try {
      const assessment = await AssessmentService.createAssessment(req.body);
      return sendResponse(res, {
        statusCode: 201,
        message: 'Assessment created successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assessment by ID (admin)
   */
  async getById(req, res, next) {
    try {
      const { includeDeleted } = req.query;
      const assessment = await AssessmentService.getAssessmentById(
        req.params.id,
        includeDeleted === 'true'
      );
      return sendResponse(res, {
        message: 'Assessment retrieved successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assessment by slug (admin)
   */
  async getBySlug(req, res, next) {
    try {
      const { includeDeleted } = req.query;
      const assessment = await AssessmentService.getAssessmentBySlug(
        req.params.slug,
        includeDeleted === 'true'
      );
      return sendResponse(res, {
        message: 'Assessment retrieved successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get published assessment by slug (public)
   */
  async getPublicBySlug(req, res, next) {
    try {
      const assessment = await AssessmentService.getPublicAssessmentBySlug(req.params.slug);
      return sendResponse(res, {
        message: 'Assessment retrieved successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all assessments (admin)
   */
  async list(req, res, next) {
    try {
      const { page, limit, status, search, includeDeleted } = req.validatedQuery || req.query;
      const result = await AssessmentService.listAssessments({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status,
        search,
        includeDeleted: includeDeleted === 'true',
      });
      return sendResponse(res, {
        message: 'Assessments retrieved successfully',
        data: result.assessments,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List soft deleted assessments (admin)
   */
  async listDeleted(req, res, next) {
    try {
      const { page, limit } = req.validatedQuery || req.query;
      const result = await AssessmentService.listDeleted({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });
      return sendResponse(res, {
        message: 'Deleted assessments retrieved successfully',
        data: result.assessments,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List published assessments (public)
   */
  async listPublic(req, res, next) {
    try {
      const { page, limit } = req.validatedQuery || req.query;
      const result = await AssessmentService.listPublishedAssessments({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });
      return sendResponse(res, {
        message: 'Assessments retrieved successfully',
        data: result.assessments,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update assessment
   */
  async update(req, res, next) {
    try {
      const assessment = await AssessmentService.updateAssessment(
        req.params.id,
        req.body
      );
      return sendResponse(res, {
        message: 'Assessment updated successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete assessment
   */
  async delete(req, res, next) {
    try {
      const assessment = await AssessmentService.deleteAssessment(
        req.params.id,
        req.user?.id || null
      );
      return sendResponse(res, {
        message: 'Assessment deleted successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore soft deleted assessment
   */
  async restore(req, res, next) {
    try {
      const assessment = await AssessmentService.restoreAssessment(req.params.id);
      return sendResponse(res, {
        message: 'Assessment restored successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate assessment
   */
  async duplicate(req, res, next) {
    try {
      const assessment = await AssessmentService.duplicateAssessment(req.params.id);
      return sendResponse(res, {
        statusCode: 201,
        message: 'Assessment duplicated successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish assessment
   */
  async publish(req, res, next) {
    try {
      const assessment = await AssessmentService.publishAssessment(req.params.id);
      return sendResponse(res, {
        message: 'Assessment published successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Archive assessment
   */
  async archive(req, res, next) {
    try {
      const assessment = await AssessmentService.archiveAssessment(req.params.id);
      return sendResponse(res, {
        message: 'Assessment archived successfully',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assessment stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await AssessmentService.getStats();
      return sendResponse(res, {
        message: 'Stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentController();