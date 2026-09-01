import AboutCmsRepository from './about-cms.repository.js';
import ApiError from '../../utils/ApiError.js';

class AboutCmsService {
  /**
   * Get public About CMS content
   */
  async getAboutContent() {
    const content = await AboutCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'About page content not found');
    }
    return content;
  }

  /**
   * Get admin About CMS content
   */
  async getAboutContentAdmin() {
    const content = await AboutCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'About page content not found');
    }
    return content;
  }

  /**
   * Update About CMS content (Admin only)
   */
  async updateAboutContent(id, data, adminId) {
    try {
      const updated = await AboutCmsRepository.update(id, data, adminId);
      if (!updated) {
        throw new ApiError(404, 'About page CMS document not found');
      }
      return updated;
    } catch (error) {
      console.error('❌ [About CMS Service Error]:', error.message, error.stack);
      throw error;
    }
  }
}

export default new AboutCmsService();
