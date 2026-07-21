import {
    NewsletterSubscriber,
    NEWSLETTER_STATUS,
  } from "./newsletter.model.js";
  
  // Escape user input for safe use inside a RegExp (prevents ReDoS / regex injection)
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  const buildFilterQuery = ({ search, status } = {}) => {
    const query = {};
  
    if (status) {
      query.status = status;
    }
  
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.email = new RegExp(safeSearch, "i");
    }
  
    return query;
  };
  
  class NewsletterRepository {
    /**
     * Find a subscriber by email
     */
    async findByEmail(email) {
      return await NewsletterSubscriber.findOne({ email }).lean();
    }
  
    /**
     * Create a new subscriber
     */
    async create(data) {
      return await NewsletterSubscriber.create(data);
    }
  
    /**
     * Reactivate / update an existing subscriber document
     */
    async updateByEmail(email, data) {
      return await NewsletterSubscriber.findOneAndUpdate(
        { email },
        { $set: data },
        { new: true, runValidators: true }
      ).lean();
    }
  
    /**
     * Find subscriber by ID
     */
    async findById(id) {
      return await NewsletterSubscriber.findById(id).lean();
    }
  
    /**
     * Find subscribers with search, filter, and pagination (admin)
     */
    async findAll({ page = 1, limit = 10, search, status } = {}) {
      const query = buildFilterQuery({ search, status });
  
      const pageNum = Math.max(Number(page) || 1, 1);
      const limitNum = Math.max(Number(limit) || 10, 1);
      const skip = (pageNum - 1) * limitNum;
  
      const [subscribers, total] = await Promise.all([
        NewsletterSubscriber.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        NewsletterSubscriber.countDocuments(query),
      ]);
  
      return {
        subscribers,
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
     * Find all subscribers matching filters, unpaginated (for export)
     */
    async findAllForExport({ search, status } = {}) {
      const query = buildFilterQuery({ search, status });
      return await NewsletterSubscriber.find(query).sort({ createdAt: -1 }).lean();
    }
  
    /**
     * Update subscriber status
     */
    async updateStatus(id, status) {
      const update = { status };
  
      if (status === NEWSLETTER_STATUS.ACTIVE) {
        update.subscribedAt = new Date();
        update.unsubscribedAt = null;
      } else if (status === NEWSLETTER_STATUS.UNSUBSCRIBED) {
        update.unsubscribedAt = new Date();
      }
  
      return await NewsletterSubscriber.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
      ).lean();
    }
  
    /**
     * Delete subscriber
     */
    async deleteById(id) {
      return await NewsletterSubscriber.findByIdAndDelete(id).lean();
    }
  
    /**
     * Get subscriber stats: total, active, unsubscribed, new today
     */
    async getStats() {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
  
      const [total, active, unsubscribed, newToday] = await Promise.all([
        NewsletterSubscriber.countDocuments(),
        NewsletterSubscriber.countDocuments({ status: NEWSLETTER_STATUS.ACTIVE }),
        NewsletterSubscriber.countDocuments({
          status: NEWSLETTER_STATUS.UNSUBSCRIBED,
        }),
        NewsletterSubscriber.countDocuments({
          createdAt: { $gte: startOfToday },
        }),
      ]);
  
      return { total, active, unsubscribed, newToday };
    }
  }
  
  export default new NewsletterRepository();