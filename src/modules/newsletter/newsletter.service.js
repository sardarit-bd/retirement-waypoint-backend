import * as XLSX from "xlsx";
import NewsletterRepository from "./newsletter.repository.js";
import { NEWSLETTER_STATUS } from "./newsletter.model.js";
import ApiError from "../../utils/ApiError.js";

// Escape a CSV field per RFC 4180 (wrap in quotes if it contains a comma,
// quote, or newline; double up any internal quotes)
const csvEscape = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

class NewsletterService {
  /**
   * Subscribe an email to the newsletter (public).
   * - Rejects if already an active subscriber.
   * - Reactivates the existing record if previously unsubscribed
   *   (keeps a single document per email — campaign-history friendly).
   */
  async subscribe(email, source = "homepage") {
    const existing = await NewsletterRepository.findByEmail(email);

    if (existing) {
      if (existing.status === NEWSLETTER_STATUS.ACTIVE) {
        throw new ApiError(409, "This email is already subscribed to our newsletter");
      }

      // Previously unsubscribed — reactivate the same record
      const reactivated = await NewsletterRepository.updateByEmail(email, {
        status: NEWSLETTER_STATUS.ACTIVE,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source,
      });

      return {
        id: reactivated._id,
        email: reactivated.email,
        status: reactivated.status,
      };
    }

    const subscriber = await NewsletterRepository.create({
      email,
      source,
      status: NEWSLETTER_STATUS.ACTIVE,
      subscribedAt: new Date(),
    });

    return {
      id: subscriber._id,
      email: subscriber.email,
      status: subscriber.status,
    };
  }

  /**
   * Get subscribers with search/filter/pagination (admin)
   */
  async getSubscribers(query = {}) {
    return await NewsletterRepository.findAll(query);
  }

  /**
   * Get a subscriber by ID (admin)
   */
  async getSubscriberById(id) {
    const subscriber = await NewsletterRepository.findById(id);

    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }

    return subscriber;
  }

  /**
   * Update a subscriber's status — activate or unsubscribe (admin)
   */
  async updateStatus(id, status) {
    const existing = await NewsletterRepository.findById(id);

    if (!existing) {
      throw new ApiError(404, "Subscriber not found");
    }

    return await NewsletterRepository.updateStatus(id, status);
  }

  /**
   * Delete a subscriber (admin)
   */
  async deleteSubscriber(id) {
    const existing = await NewsletterRepository.findById(id);

    if (!existing) {
      throw new ApiError(404, "Subscriber not found");
    }

    await NewsletterRepository.deleteById(id);
    return { id };
  }

  /**
   * Get subscriber stats (admin + dashboard summary card)
   */
  async getStats() {
    return await NewsletterRepository.getStats();
  }

  /**
   * Export subscribers as CSV or Excel (admin)
   */
  async exportSubscribers({ format = "csv", search, status } = {}) {
    const subscribers = await NewsletterRepository.findAllForExport({
      search,
      status,
    });

    const rows = subscribers.map((s) => ({
      Email: s.email,
      Status: s.status,
      Source: s.source,
      "Subscribed Date": s.subscribedAt
        ? new Date(s.subscribedAt).toISOString()
        : "",
      "Unsubscribed Date": s.unsubscribedAt
        ? new Date(s.unsubscribedAt).toISOString()
        : "",
      "Created Date": new Date(s.createdAt).toISOString(),
    }));

    const headers = [
      "Email",
      "Status",
      "Source",
      "Subscribed Date",
      "Unsubscribed Date",
      "Created Date",
    ];

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 14 },
        { wch: 12 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return {
        buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: `newsletter-subscribers-${Date.now()}.xlsx`,
      };
    }

    // CSV (default)
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => csvEscape(row[h])).join(","));
    }
    const csvContent = lines.join("\r\n");

    return {
      buffer: Buffer.from(csvContent, "utf-8"),
      contentType: "text/csv; charset=utf-8",
      filename: `newsletter-subscribers-${Date.now()}.csv`,
    };
  }
}

export default new NewsletterService();