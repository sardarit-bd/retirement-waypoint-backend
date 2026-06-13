import express from "express";
import { AuthController } from "./auth.controller.js";
import { protect, restrictTo } from "../../middleware/authMiddleware.js";
import { validate, updateProfileValidation, updateRoleValidation } from "./auth.validation.js";

const router = express.Router();

// Protected routes
router.get("/me", protect, AuthController.getMe);
router.patch("/me", protect, validate(updateProfileValidation), AuthController.updateProfile);

// Admin only routes
router.get("/users", protect, restrictTo("admin"), AuthController.getAllUsers);
router.get("/users/:id", protect, restrictTo("admin"), AuthController.getUserById);
router.patch(
  "/users/:id/role",
  protect,
  restrictTo("admin"),
  validate(updateRoleValidation),
  AuthController.updateUserRole
);
router.post("/users/:id/deactivate", protect, restrictTo("admin"), AuthController.deactivateUser);
router.post("/users/:id/activate", protect, restrictTo("admin"), AuthController.activateUser);

// Better-auth routes (signup, signin, etc.)
router.use("/", AuthController.authHandler);

export const AuthRoutes = router;
