import { Contact, CONTACT_STATUS } from "./contact.model.js";

// Escape user input for safe use inside a RegExp (prevents ReDoS / regex injection)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class ContactRepository {
  /**
   * Create a new contact message
   */
  async create(data) {
    return await Contact.create(data);
  }

  /**
   * Find message by ID
   */
  async findById(id) {
    return await Contact.findById(id).lean();
  }

  /**
   * Find messages with search, filter, and pagination (admin)
   */
  async findAll({ page = 1, limit = 10, search, status } = {}) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(query),
    ]);

    return {
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Update message status
   */
  async updateStatus(id, status) {
    return await Contact.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Delete message
   */
  async deleteById(id) {
    return await Contact.findByIdAndDelete(id).lean();
  }

  /**
   * Get message stats (counts by status)
   */
  async getStats() {
    const [total, unread, read, replied, archived] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: CONTACT_STATUS.UNREAD }),
      Contact.countDocuments({ status: CONTACT_STATUS.READ }),
      Contact.countDocuments({ status: CONTACT_STATUS.REPLIED }),
      Contact.countDocuments({ status: CONTACT_STATUS.ARCHIVED }),
    ]);

    return { total, unread, read, replied, archived };
  }

  /**
   * Get unread count only (lightweight, for dashboard summary card)
   */
  async getUnreadCount() {
    return await Contact.countDocuments({ status: CONTACT_STATUS.UNREAD });
  }
}

export default new ContactRepository();