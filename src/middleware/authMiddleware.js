import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import { auth } from "../config/betterAuth.js";

export const protect = catchAsync(async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  
  if (!session) {
    return next(new ApiError(401, "You are not logged in. Please login first."));
  }

  if (session.user.banned) {
    return next(new ApiError(403, "Your account has been deactivated"));
  }

  req.user = session.user;
  req.session = session.session;
  req.auth = {
    userId: session.user.id,
    role: session.user.role || "user",
    user: session.user,
    session: session.session,
  };

  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role || "user")) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }

    next();
  };
};

export const isAdmin = restrictTo("admin");
export const isCoach = restrictTo("admin", "coach");
