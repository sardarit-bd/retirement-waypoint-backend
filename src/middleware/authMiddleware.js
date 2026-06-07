// import { auth } from 'better-auth';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

export const protect = catchAsync(async (req, res, next) => {
  const session = req.headers.authorization;
  
  if (!session) {
    return next(new ApiError(401, 'You are not logged in. Please login first.'));
  }
  
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
};