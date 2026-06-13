import mongoose from "mongoose";
import { UserProfile } from "./auth.model.js";
import ApiError from "../../utils/ApiError.js";

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
    return profile || {
      role: "user",
      isActive: true,
      phone: undefined,
      profileImage: undefined,
      bio: undefined,
      preferences: {
        newsletter: false,
        notifications: true,
      },
    };
  }

  async getAuthUserById(userId) {
    const user = await this.getUserCollection().findOne(this.getUserIdFilter(userId));
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
    
    const allowedUpdates = ["phone", "bio", "preferences", "profileImage"];
    const filteredData = {};
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }
    
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: filteredData },
      { new: true, runValidators: true }
    );
    
    return updatedProfile;
  }

  async getAllUsers(query = {}) {
    const { page = 1, limit = 20, role, search } = query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    let roleUserFilter = null;

    if (role) {
      const profileFilter = role === "user" ? { role: { $ne: "user" } } : { role };
      const profiles = await UserProfile.find(profileFilter).select("userId").lean();
      const userIds = profiles.map((profile) => profile.userId);

      if (role === "user") {
        roleUserFilter = userIds.length > 0 ? this.getUsersExcludeIdFilter(userIds) : null;
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

    const searchTerm = typeof search === "string" ? this.escapeRegex(search.trim()) : "";
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
    const profiles = await UserProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));

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

  async updateUserRole(userId, role) {
    if (!["user", "admin", "coach"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await this.getAuthUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: { role },
        $setOnInsert: { isActive: true },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return profile;
  }

  async deactivateUser(userId) {
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
      { new: true, upsert: true, runValidators: true }
    );

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
      { new: true, upsert: true, runValidators: true }
    );

    return profile;
  }
}

const AuthService = new AuthServiceClass();
export default AuthService;
