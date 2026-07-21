import { AssessmentLanding } from './assessment-landing.model.js';

class AssessmentLandingRepository {
  /**
   * Get the singleton landing document
   */
  async getLanding() {
    return await AssessmentLanding.getSingleton();
  }

  /**
   * Get landing by ID
   */
  async findById(id) {
    return await AssessmentLanding.findById(id).lean();
  }

  /**
   * Update landing by ID
   */
  async updateById(id, updateData) {
    return await AssessmentLanding.findByIdAndUpdate(
      id,
      { 
        ...updateData, 
        updatedAt: new Date(),
        updatedBy: updateData.updatedBy || null,
      },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Check if landing exists
   */
  async exists() {
    const count = await AssessmentLanding.countDocuments();
    return count > 0;
  }

  /**
   * Create initial landing (used by seeder)
   */
  async createInitial(initialData) {
    return await AssessmentLanding.create(initialData);
  }
}

export default new AssessmentLandingRepository();