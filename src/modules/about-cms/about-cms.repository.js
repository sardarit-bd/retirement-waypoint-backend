import mongoose from 'mongoose';
import { AboutCms } from './about-cms.model.js';

class AboutCmsRepository {
  /**
   * Get the singleton About CMS document (creates if none exists)
   */
  async getSingleton() {
    return await AboutCms.getSingleton();
  }

  /**
   * Update the singleton About CMS document safely
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
      doc = await AboutCms.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!doc) {
      const singleton = await AboutCms.getSingleton();
      doc = await AboutCms.findByIdAndUpdate(
        singleton._id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    return doc;
  }
}

export default new AboutCmsRepository();
