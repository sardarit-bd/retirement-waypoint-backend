import AssessmentLandingRepository from './assessment-landing.repository.js';
import ApiError from '../../utils/ApiError.js';

class AssessmentLandingService {
  /**
   * Get landing content (public)
   */
  async getLanding() {
    const landing = await AssessmentLandingRepository.getLanding();
    return landing;
  }

  /**
   * Get landing by ID (admin)
   */
  async getLandingById(id) {
    const landing = await AssessmentLandingRepository.findById(id);
    if (!landing) {
      throw new ApiError(404, 'Landing configuration not found');
    }
    return landing;
  }

  /**
   * Update landing (admin)
   */
  async updateLanding(id, updateData, userId = null) {
    const existing = await AssessmentLandingRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Landing configuration not found');
    }

    const updated = await AssessmentLandingRepository.updateById(id, {
      ...updateData,
      updatedBy: userId,
    });

    return updated;
  }

  /**
   * Create initial landing (used by seeder)
   */
  async createInitial(initialData) {
    const exists = await AssessmentLandingRepository.exists();
    if (exists) {
      return await AssessmentLandingRepository.getLanding();
    }
    return await AssessmentLandingRepository.createInitial(initialData);
  }
}

export default new AssessmentLandingService();