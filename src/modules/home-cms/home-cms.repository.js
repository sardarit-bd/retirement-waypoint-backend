import mongoose from 'mongoose';
import { HomeCms } from './home-cms.model.js';

class HomeCmsRepository {
  /**
   * Get the singleton Home CMS document (creates if none exists)
   */
  async getSingleton() {
    return await HomeCms.getSingleton();
  }

  /**
   * Update the singleton Home CMS document safely
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
      doc = await HomeCms.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!doc) {
      const singleton = await HomeCms.getSingleton();
      doc = await HomeCms.findByIdAndUpdate(
        singleton._id,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );
    }

    return doc;
  }
}

export default new HomeCmsRepository();
