import mongoose from "mongoose";

export const CONTACT_STATUS = {
  UNREAD: "unread",
  READ: "read",
  REPLIED: "replied",
  ARCHIVED: "archived",
};

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: Object.values(CONTACT_STATUS),
      default: CONTACT_STATUS.UNREAD,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search (name, email, subject)
contactSchema.index({ name: "text", email: "text", subject: "text" });
contactSchema.index({ status: 1, createdAt: -1 });

export const Contact = mongoose.model("Contact", contactSchema);