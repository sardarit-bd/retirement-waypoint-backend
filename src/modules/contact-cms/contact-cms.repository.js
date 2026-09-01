import mongoose from 'mongoose';
import { ContactCms } from './contact-cms.model.js';

class ContactCmsRepository {
  /**
   * Get the singleton Contact CMS document (creates if none exists)
   */
  async getSingleton() {
    return await ContactCms.getSingleton();
  }

  /**
   * Update the singleton Contact CMS document safely
   */
  async update(id, data, adminId) {
    // Strip immutable / system fields
    const { _id, __v, createdAt, updatedAt, ...cleanData } = data || {};

    const updateData = {
      ...cleanData,
      updatedBy: adminId || 'admin',
    };

    let doc = null;

    if (id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id)) {
      doc = await ContactCms.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!doc) {
      const singleton = await ContactCms.getSingleton();
      doc = await ContactCms.findByIdAndUpdate(
        singleton._id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    return doc;
  }
}

export default new ContactCmsRepository();
