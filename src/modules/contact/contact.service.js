import ContactRepository from "./contact.repository.js";
import { CONTACT_STATUS } from "./contact.model.js";
import { sendEmail } from "../../config/mailer.js";
import ApiError from "../../utils/ApiError.js";

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

class ContactService {
  /**
   * Submit a contact form message (public)
   */
  async submitMessage(data, meta = {}) {
    const contact = await ContactRepository.create({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: CONTACT_STATUS.UNREAD,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
    });

    // Notify admin — failures here should never break the user-facing flow
    this.sendAdminNotification(contact).catch((error) => {
      console.warn(
        `Failed to send contact notification email: ${error.message}`
      );
    });

    return {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      createdAt: contact.createdAt,
    };
  }

  /**
   * Send the "New Contact Inquiry" email to the admin
   */
  async sendAdminNotification(contact) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.warn(
        "ADMIN_EMAIL is not configured — skipping contact notification email."
      );
      return;
    }

    const submittedAt = new Date(contact.createdAt || Date.now()).toLocaleString(
      "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    );

    await sendEmail({
      to: adminEmail,
      subject: "New Contact Inquiry",
      text: `New contact inquiry from ${contact.name} (${contact.email})\n\nSubject: ${contact.subject}\n\nMessage:\n${contact.message}\n\nSubmitted: ${submittedAt}\nIP Address: ${contact.ipAddress || "Unknown"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background:#1B2B4B;padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#ffffff;margin:0;">New Contact Inquiry</h2>
          </div>
          <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#666;width:140px;">Name</td>
                <td style="padding:8px 0;font-weight:600;color:#1B2B4B;">${escapeHtml(contact.name)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Email</td>
                <td style="padding:8px 0;font-weight:600;color:#1B2B4B;">
                  <a href="mailto:${escapeHtml(contact.email)}" style="color:#4f46e5;">${escapeHtml(contact.email)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Subject</td>
                <td style="padding:8px 0;font-weight:600;color:#1B2B4B;">${escapeHtml(contact.subject)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Submitted</td>
                <td style="padding:8px 0;color:#1B2B4B;">${submittedAt}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">IP Address</td>
                <td style="padding:8px 0;color:#1B2B4B;">${escapeHtml(contact.ipAddress || "Unknown")}</td>
              </tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#F8F5EF;border-radius:8px;">
              <p style="margin:0 0 8px 0;color:#666;font-size:13px;">Message</p>
              <p style="margin:0;color:#1B2B4B;white-space:pre-wrap;line-height:1.6;">${escapeHtml(contact.message)}</p>
            </div>
          </div>
        </div>
      `,
    });
  }

  /**
   * Get messages with search/filter/pagination (admin)
   */
  async getMessages(query = {}) {
    return await ContactRepository.findAll(query);
  }

  /**
   * Get a message by ID (admin)
   */
  async getMessageById(id) {
    const message = await ContactRepository.findById(id);

    if (!message) {
      throw new ApiError(404, "Contact message not found");
    }

    return message;
  }

  /**
   * Update a message's status (admin)
   */
  async updateStatus(id, status) {
    const existing = await ContactRepository.findById(id);

    if (!existing) {
      throw new ApiError(404, "Contact message not found");
    }

    return await ContactRepository.updateStatus(id, status);
  }

  /**
   * Delete a message (admin)
   */
  async deleteMessage(id) {
    const existing = await ContactRepository.findById(id);

    if (!existing) {
      throw new ApiError(404, "Contact message not found");
    }

    await ContactRepository.deleteById(id);
    return { id };
  }

  /**
   * Get message stats (admin)
   */
  async getStats() {
    return await ContactRepository.getStats();
  }

  /**
   * Get unread count only (dashboard summary card)
   */
  async getUnreadCount() {
    const unread = await ContactRepository.getUnreadCount();
    return { unread };
  }
}

export default new ContactService();