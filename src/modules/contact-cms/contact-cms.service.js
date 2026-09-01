import ContactCmsRepository from './contact-cms.repository.js';
import ApiError from '../../utils/ApiError.js';

class ContactCmsService {
  /**
   * Get public Contact CMS content
   */
  async getContactContent() {
    const content = await ContactCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Contact page content not found');
    }
    return content;
  }

  /**
   * Get admin Contact CMS content
   */
  async getContactContentAdmin() {
    const content = await ContactCmsRepository.getSingleton();
    if (!content) {
      throw new ApiError(404, 'Contact page content not found');
    }
    return content;
  }

  /**
   * Update Contact CMS content (Admin only)
   */
  async updateContactContent(id, data, adminId) {
    try {
      const updated = await ContactCmsRepository.update(id, data, adminId);
      if (!updated) {
        throw new ApiError(404, 'Contact page CMS document not found');
      }
      return updated;
    } catch (error) {
      console.error('❌ [Contact CMS Service Error]:', error.message, error.stack);
      throw error;
    }
  }
}

export default new ContactCmsService();
