import HomeCmsRepository from './home-cms.repository.js';
import ApiError from '../../utils/ApiError.js';

class HomeCmsService {
  /**
   * Get public Home CMS content
   */
  async getHomeContent() {
    const content = await HomeCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Home page content not found');
    }
    return content;
  }

  /**
   * Get admin Home CMS content
   */
  async getHomeContentAdmin() {
    const content = await HomeCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Home page content not found');
    }
    return content;
  }

  /**
   * Update Home CMS content (Admin only)
   */
  async updateHomeContent(id, data, adminId) {
    try {
      const updated = await HomeCmsRepository.update(id, data, adminId);
      if (!updated) {
        throw new ApiError(404, 'Home page CMS document not found');
      }
      return updated;
    } catch (error) {
      console.error('❌ [Home CMS Service Error]:', error.message, error.stack);
      throw error;
    }
  }
}

export default new HomeCmsService();
