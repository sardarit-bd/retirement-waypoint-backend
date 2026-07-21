import mongoose from "mongoose";

export const NEWSLETTER_STATUS = {
  ACTIVE: "active",
  UNSUBSCRIBED: "unsubscribed",
};

export const NEWSLETTER_SOURCE = {
  HOMEPAGE: "homepage",
  FOOTER: "footer",
  CONTACT: "contact",
  MANUAL: "manual",
};

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NEWSLETTER_STATUS),
      default: NEWSLETTER_STATUS.ACTIVE,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(NEWSLETTER_SOURCE),
      default: NEWSLETTER_SOURCE.HOMEPAGE,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },

    // --- Future-ready fields (not used yet, but keep the schema campaign-ready) ---
    // tags: { type: [String], default: [] },              // subscriber segmentation
    // campaignsSent: { type: [mongoose.Schema.Types.ObjectId], ref: "Campaign", default: [] },
    // lastEmailedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

newsletterSubscriberSchema.index({ email: "text" });
newsletterSubscriberSchema.index({ status: 1, createdAt: -1 });

export const NewsletterSubscriber = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema
);