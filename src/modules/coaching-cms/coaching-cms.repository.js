import mongoose from 'mongoose';
import { CoachingCms } from './coaching-cms.model.js';

class CoachingCmsRepository {
  /**
   * Get the singleton Coaching CMS document (creates if none exists)
   */
  async getSingleton() {
    return await CoachingCms.getSingleton();
  }

  /**
   * Update the singleton Coaching CMS document safely
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
      doc = await CoachingCms.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!doc) {
      const singleton = await CoachingCms.getSingleton();
      doc = await CoachingCms.findByIdAndUpdate(
        singleton._id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    return doc;
  }
}

export default new CoachingCmsRepository();
