import mongoose from "mongoose";

// This schema is for additional user info beyond better-auth's default
const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "coach"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    profileImagePublicId: {
      type: String,
      select: false,
    },
    bio: {
      type: String,
      maxLength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      newsletter: {
        type: Boolean,
        default: false,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
userProfileSchema.index({ role: 1 });
userProfileSchema.index({ isActive: 1 });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
