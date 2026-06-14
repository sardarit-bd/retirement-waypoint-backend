import mongoose from "mongoose";
import { UserProfile } from "./auth.model.js";
import ApiError from "../../utils/ApiError.js";
import UploadService from "../upload/upload.service.js";

class AuthServiceClass {
  getUserCollection() {
    return mongoose.connection.db.collection("user");
  }

  normalizeUser(user) {
    if (!user) return null;

    const { _id, ...rest } = user;

    return {
      id: user.id || _id?.toString(),
      ...rest,
    };
  }

  getUserIdFilter(userId) {
    const filters = [{ id: userId }];

    if (mongoose.Types.ObjectId.isValid(userId)) {
      filters.push({ _id: new mongoose.Types.ObjectId(userId) });
    }

    return { $or: filters };
  }

  getUsersIdFilter(userIds) {
    const objectIds = userIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const filters = [{ id: { $in: userIds } }];

    if (objectIds.length > 0) {
      filters.push({ _id: { $in: objectIds } });
    }

    return { $or: filters };
  }

  getUsersExcludeIdFilter(userIds) {
    const objectIds = userIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const filters = [{ id: { $nin: userIds } }];

    if (objectIds.length > 0) {
      filters.push({ _id: { $nin: objectIds } });
    }

    return { $and: filters };
  }

  combineFilters(...filters) {
    const validFilters = filters.filter(Boolean);

    if (validFilters.length === 0) return {};
    if (validFilters.length === 1) return validFilters[0];

    return { $and: validFilters };
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  getProfilePayload(profile) {
    return (
      profile || {
        role: "user",
        isActive: true,
        phone: undefined,
        profileImage: undefined,
        bio: undefined,
        preferences: {
          newsletter: false,
          notifications: true,
        },
      }
    );
  }

  async getAuthUserById(userId) {
    const user = await this.getUserCollection().findOne(
      this.getUserIdFilter(userId),
    );
    return this.normalizeUser(user);
  }

  async getUserById(userId) {
    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const profile = await UserProfile.findOne({ userId: user.id });

    return {
      ...user,
      profile: this.getProfilePayload(profile),
    };
  }

  async getUserProfile(userId) {
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      // Create default profile if doesn't exist
      return await this.createDefaultProfile(userId);
    }

    return profile;
  }

  async createDefaultProfile(userId) {
    const profile = await UserProfile.create({
      userId,
      role: "user",
      isActive: true,
    });

    return profile;
  }

  async updateUserProfile(userId, updateData) {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = await this.createDefaultProfile(userId);
    }

    const allowedUpdates = ["phone", "bio"];
    const filteredData = {};

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    if (updateData.preferences?.newsletter !== undefined) {
      filteredData["preferences.newsletter"] = updateData.preferences.newsletter;
    }

    if (updateData.preferences?.notifications !== undefined) {
      filteredData["preferences.notifications"] = updateData.preferences.notifications;
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: filteredData },
      { new: true, runValidators: true },
    );

    return updatedProfile;
  }

  async updateProfileImage(userId, file) {
    if (!file) {
      throw new ApiError(400, "Profile image is required");
    }

    const currentProfile = await UserProfile.findOne({ userId })
      .select("+profileImagePublicId");

    const uploadedImage = await UploadService.uploadFile(file, userId, {
      folder: "profiles",
      maxSize: 5,
      transformations: [
        { width: 500, height: 500, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          profileImage: uploadedImage.url,
          profileImagePublicId: uploadedImage.publicId,
        },
        $setOnInsert: {
          role: "user",
          isActive: true,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    if (currentProfile?.profileImagePublicId) {
      try {
        await UploadService.deleteFile(
          currentProfile.profileImagePublicId,
          userId,
        );
      } catch (error) {
        console.warn(`Old profile image cleanup failed: ${error.message}`);
      }
    }

    return profile;
  }

  async removeProfileImage(userId) {
    const profile = await UserProfile.findOne({ userId })
      .select("+profileImagePublicId");

    if (!profile?.profileImage) {
      throw new ApiError(404, "Profile image not found");
    }

    const publicId = profile.profileImagePublicId;
    profile.profileImage = undefined;
    profile.profileImagePublicId = undefined;
    await profile.save();

    if (publicId) {
      try {
        await UploadService.deleteFile(publicId, userId);
      } catch (error) {
        console.warn(`Profile image cleanup failed: ${error.message}`);
      }
    }

    return profile;
  }

  async getAllUsers(query = {}) {
    const { page = 1, limit = 20, role, search } = query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    let roleUserFilter = null;

    if (role) {
      const profileFilter =
        role === "user" ? { role: { $ne: "user" } } : { role };
      const profiles = await UserProfile.find(profileFilter)
        .select("userId")
        .lean();
      const userIds = profiles.map((profile) => profile.userId);

      if (role === "user") {
        roleUserFilter =
          userIds.length > 0 ? this.getUsersExcludeIdFilter(userIds) : null;
      } else if (userIds.length === 0) {
        return {
          users: [],
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: 0,
            totalPages: 0,
          },
        };
      } else {
        roleUserFilter = this.getUsersIdFilter(userIds);
      }
    }

    const searchTerm =
      typeof search === "string" ? this.escapeRegex(search.trim()) : "";
    const searchFilter = searchTerm
      ? {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : null;

    const userFilter = this.combineFilters(roleUserFilter, searchFilter);
    const userCollection = this.getUserCollection();

    const [users, total] = await Promise.all([
      userCollection
        .find(userFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .toArray(),
      userCollection.countDocuments(userFilter),
    ]);

    const normalizedUsers = users.map((user) => this.normalizeUser(user));
    const userIds = normalizedUsers.map((user) => user.id);
    const profiles = await UserProfile.find({
      userId: { $in: userIds },
    }).lean();
    const profileMap = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    );

    const usersWithProfiles = normalizedUsers.map((user) => ({
      ...user,
      profile: this.getProfilePayload(profileMap.get(user.id)),
    }));

    return {
      users: usersWithProfiles,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async updateUserRole(userId, role, actorUserId) {
    if (!["user", "admin", "coach"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (userId === actorUserId && role !== "admin") {
      throw new ApiError(400, "You cannot remove your own admin role");
    }

    const currentProfile = await UserProfile.findOne({ userId });

    if (currentProfile?.role === "admin" && role !== "admin") {
      const adminCount = await UserProfile.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        throw new ApiError(400, "The last admin cannot be demoted");
      }
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: { role },
        $setOnInsert: { isActive: true },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return profile;
  }

  async deactivateUser(userId, actorUserId) {
    if (userId === actorUserId) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: { isActive: false },
        $setOnInsert: { role: "user" },
      },
      { new: true, upsert: true, runValidators: true },
    );

    const sessionUserFilters = [{ userId }];

    if (mongoose.Types.ObjectId.isValid(userId)) {
      sessionUserFilters.push({
        userId: new mongoose.Types.ObjectId(userId),
      });
    }

    await mongoose.connection.db
      .collection("session")
      .deleteMany({ $or: sessionUserFilters });

    return profile;
  }

  async activateUser(userId) {
    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: { isActive: true },
        $setOnInsert: { role: "user" },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return profile;
  }

  async bootstrapAdmin(userId, setupSecret) {
    if (!process.env.ADMIN_SETUP_SECRET) {
      throw new ApiError(500, "Admin setup is not configured");
    }

    if (!setupSecret) {
      throw new ApiError(400, "x-admin-setup-secret header is required");
    }

    if (setupSecret !== process.env.ADMIN_SETUP_SECRET) {
      throw new ApiError(403, "Invalid admin setup secret");
    }

    const existingAdmin = await UserProfile.exists({ role: "admin" });

    if (existingAdmin) {
      throw new ApiError(409, "Admin already exists");
    }

    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          role: "admin",
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );
  }
}

const AuthService = new AuthServiceClass();
export default AuthService;
