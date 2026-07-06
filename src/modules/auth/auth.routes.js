import express from "express";
import { AuthController } from "./auth.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";
import {
  validate,
  getUsersValidation,
  updateProfileValidation,
  updateRoleValidation,
} from "./auth.validation.js";
import { profileImageUpload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes - Add these at the top of the file
router.get("/check-email", AuthController.checkEmailExists);
router.post(
  "/resend-verification",
  express.json(),
  AuthController.resendVerification,
);
router.get("/verify-email", AuthController.verifyEmail);

// Protected routes
router.get("/me", protect, AuthController.getMe);
router.patch(
  "/me",
  express.json(),
  protect,
  validate(updateProfileValidation),
  AuthController.updateProfile,
);
router.patch(
  "/me/profile-image",
  protect,
  profileImageUpload,
  AuthController.updateProfileImage,
);
router.delete("/me/profile-image", protect, AuthController.removeProfileImage);

// Admin only routes
router.get(
  "/users",
  protect,
  restrictTo("admin"),
  validate(getUsersValidation),
  AuthController.getAllUsers,
);
router.get(
  "/users/:id",
  protect,
  restrictTo("admin"),
  AuthController.getUserById,
);
router.patch(
  "/users/:id/role",
  express.json(),
  protect,
  restrictTo("admin"),
  validate(updateRoleValidation),
  AuthController.updateUserRole,
);
router.post(
  "/users/:id/deactivate",
  protect,
  restrictTo("admin"),
  AuthController.deactivateUser,
);
router.post(
  "/users/:id/activate",
  protect,
  restrictTo("admin"),
  AuthController.activateUser,
);
router.post("/bootstrap-admin", protect, AuthController.bootstrapAdmin);
// Better-auth routes (signup, signin, etc.)
router.use("/", AuthController.authHandler);

export const AuthRoutes = router;
