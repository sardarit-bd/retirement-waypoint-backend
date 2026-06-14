import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import { UserProfile } from "../modules/auth/auth.model.js";
import { auth } from "../config/betterAuth.js";

export const protect = catchAsync(async (req, res, next) => {
  // Get session from better-auth
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  
  if (!session) {
    return next(new ApiError(401, "You are not logged in. Please login first."));
  }

  const profile = await UserProfile.findOne({ userId: session.user.id });

  if (profile && profile.isActive === false) {
    return next(new ApiError(403, "Your account has been deactivated"));
  }
  
  req.user = session.user;
  req.session = session.session;
  
  next();
});

export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    const userRole = profile?.role || "user";
    
    if (!roles.includes(userRole)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    
    next();
  });
};

export const isAdmin = restrictTo("admin");
export const isCoach = restrictTo("admin", "coach");
