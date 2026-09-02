import CoachingCmsRepository from './coaching-cms.repository.js';
import ApiError from '../../utils/ApiError.js';

class CoachingCmsService {
  /**
   * Get public Coaching CMS content
   */
  async getCoachingContent() {
    const content = await CoachingCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Coaching page content not found');
    }
    return content;
  }

  /**
   * Get admin Coaching CMS content
   */
  async getCoachingContentAdmin() {
    const content = await CoachingCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Coaching page content not found');
    }
    return content;
  }

  /**
   * Update Coaching CMS content (Admin only)
   */
  async updateCoachingContent(id, data, adminId) {
    try {
      const updated = await CoachingCmsRepository.update(id, data, adminId);
      if (!updated) {
        throw new ApiError(404, 'Coaching page CMS document not found');
      }
      return updated;
    } catch (error) {
      console.error('❌ [Coaching CMS Service Error]:', error.message, error.stack);
      throw error;
    }
  }
}

export default new CoachingCmsService();
