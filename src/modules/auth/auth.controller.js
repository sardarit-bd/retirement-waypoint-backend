import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import AuthService from "./auth.service.js";
import { auth } from "../../config/betterAuth.js";
import { toNodeHandler } from "better-auth/node";
import { getRequestOrigin } from "../../config/origins.js";

const getMe = catchAsync(async (req, res) => {
  const user = req.user;

  const profile = await AuthService.getUserProfile(user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User profile retrieved successfully",
    data: {
      ...user,
      profile,
    },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;

  const updatedProfile = await AuthService.updateUserProfile(
    userId,
    updateData,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile updated successfully",
    data: updatedProfile,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  const profile = await AuthService.updateProfileImage(req.user.id, req.file);

  sendResponse(res, {
    statusCode: 200,
    message: "Profile image updated successfully",
    data: profile,
  });
});

const removeProfileImage = catchAsync(async (req, res) => {
  const profile = await AuthService.removeProfileImage(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    message: "Profile image removed successfully",
    data: profile,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, role, search } = req.validatedQuery || req.query;

  const result = await AuthService.getAllUsers({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    role,
    search,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users retrieved successfully",
    data: result.users,
    meta: result.pagination,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await AuthService.getUserById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User retrieved successfully",
    data: user,
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const updatedUser = await AuthService.updateUserRole(id, role, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User role updated successfully",
    data: updatedUser,
  });
});

const deactivateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await AuthService.deactivateUser(id, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deactivated successfully",
    data: result,
  });
});

const activateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await AuthService.activateUser(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User activated successfully",
    data: result,
  });
});

const bootstrapAdmin = catchAsync(async (req, res) => {
  const setupSecret = req.headers["x-admin-setup-secret"];

  const profile = await AuthService.bootstrapAdmin(req.user.id, setupSecret);

  sendResponse(res, {
    statusCode: 200,
    message: "First admin created successfully",
    data: profile,
  });
});

const checkEmailExists = catchAsync(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return sendResponse(res, {
      success: false,
      statusCode: 400,
      message: "Email is required",
    });
  }

  const exists = await AuthService.checkEmailExists(email);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Email check completed",
    data: { exists },
  });
});

const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendResponse(res, {
      success: false,
      statusCode: 400,
      message: "Email is required",
    });
  }

  const result = await AuthService.resendVerificationEmail(
    email,
    getRequestOrigin(req),
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: {},
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return sendResponse(res, {
      success: false,
      statusCode: 400,
      message: "Verification token is required",
    });
  }

  const result = await AuthService.verifyEmailToken(
    token,
    getRequestOrigin(req),
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Email verified successfully",
    data: result,
  });
});

// Get better-auth API routes handler
const authHandler = toNodeHandler(auth);

export const AuthController = {
  getMe,
  updateProfile,
  updateProfileImage,
  removeProfileImage,
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  authHandler,
  bootstrapAdmin,
  checkEmailExists,
  resendVerification,
  verifyEmail,
};
