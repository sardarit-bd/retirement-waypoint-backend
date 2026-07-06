import mongoose from "mongoose";
import { Coupon } from "./coupon.model.js";
import { CouponUsage } from "./couponUsage.model.js";
import { Order } from "../order/order.model.js";
import ApiError from "../../utils/ApiError.js";

class CouponServiceClass {
  /**
   * Calculate discount amount for a coupon
   */
  calculateDiscount(coupon, subtotal) {
    let discountAmount = 0;

    if (coupon.type === "PERCENTAGE") {
      discountAmount = (coupon.value / 100) * subtotal;
      
      // Apply maximum discount limit if set
      if (coupon.maximumDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscountAmount);
      }
    } else if (coupon.type === "FIXED_AMOUNT") {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate coupon for a user and subtotal
   */
  async validateCoupon(code, userId, subtotal) {
    // Find coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    // Check if active
    if (!coupon.isActive) {
      throw new ApiError(400, "Coupon is inactive");
    }

    // Check if expired
    if (coupon.isExpired) {
      throw new ApiError(400, "Coupon has expired");
    }

    // Check valid from date
    if (coupon.validFrom && new Date() < coupon.validFrom) {
      throw new ApiError(400, "Coupon is not yet valid");
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit has been reached");
    }

    // Check minimum order amount
    if (subtotal < coupon.minimumOrderAmount) {
      throw new ApiError(
        400,
        `Minimum order amount of $${coupon.minimumOrderAmount.toFixed(2)} required`
      );
    }

    // Check per-user limit
    if (userId) {
      const userUsageCount = await CouponUsage.countDocuments({
        couponId: coupon._id,
        userId,
      });

      if (userUsageCount >= coupon.perUserLimit) {
        throw new ApiError(400, "You have already used this coupon the maximum number of times");
      }
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(coupon, subtotal);
    const finalAmount = subtotal - discountAmount;

    return {
      valid: true,
      coupon: coupon.toObject(),
      discountAmount,
      finalAmount,
    };
  }

  /**
   * Create coupon (admin)
   */
  async createCoupon(couponData, userId) {
    // Check if code already exists
    const existing = await Coupon.findOne({
      code: couponData.code.toUpperCase(),
    });
    if (existing) {
      throw new ApiError(400, "Coupon code already exists");
    }

    // Validate expiry date is in future
    if (new Date(couponData.expiresAt) <= new Date()) {
      throw new ApiError(400, "Expiration date must be in the future");
    }

    const coupon = await Coupon.create({
      ...couponData,
      code: couponData.code.toUpperCase(),
      createdBy: userId,
    });

    return coupon;
  }

  /**
   * Update coupon (admin)
   */
  async updateCoupon(couponId, updateData) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    // Check if code is being changed and already exists
    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: couponId },
      });
      if (existing) {
        throw new ApiError(400, "Coupon code already exists");
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate expiry date
    if (updateData.expiresAt) {
      const expiryDate = new Date(updateData.expiresAt);
      if (expiryDate <= new Date()) {
        throw new ApiError(400, "Expiration date must be in the future");
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updatedCoupon;
  }

  /**
   * Activate coupon (admin)
   */
  async activateCoupon(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    if (coupon.isActive) {
      throw new ApiError(400, "Coupon is already active");
    }

    coupon.isActive = true;
    await coupon.save();

    return coupon;
  }

  /**
   * Deactivate coupon (admin)
   */
  async deactivateCoupon(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    if (!coupon.isActive) {
      throw new ApiError(400, "Coupon is already inactive");
    }

    coupon.isActive = false;
    await coupon.save();

    return coupon;
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    return coupon;
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    return coupon;
  }

  /**
   * Get all coupons (admin)
   */
  async getAllCoupons(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      isActive,
      expired,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Search by code or name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ code: searchRegex }, { name: searchRegex }];
    }

    // Filter expired coupons
    if (expired !== undefined) {
      if (expired === "true") {
        filter.expiresAt = { $lt: new Date() };
      } else {
        filter.expiresAt = { $gte: new Date() };
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  /**
   * Delete coupon (admin)
   */
  async deleteCoupon(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    // Check if coupon has been used
    const usageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
    });

    if (usageCount > 0) {
      throw new ApiError(400, "Cannot delete coupon that has been used");
    }

    await coupon.deleteOne();

    return { success: true, message: "Coupon deleted successfully" };
  }

  /**
   * Get coupon usage history
   */
  async getCouponUsage(couponId, query = {}) {
    const {
      page = 1,
      limit = 20,
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { couponId };

    const [usages, total] = await Promise.all([
      CouponUsage.find(filter)
        .sort({ usedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("orderId", "orderNumber totalAmount"),
      CouponUsage.countDocuments(filter),
    ]);

    return {
      usages,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  /**
   * Record coupon usage after successful payment
   */
  async recordCouponUsage(orderId, userId, couponId, discountAmount) {
    // Check if already recorded (idempotency)
    const existing = await CouponUsage.findOne({ orderId });
    if (existing) {
      console.log(`⚠️ Coupon usage already recorded for order ${orderId}`);
      return existing;
    }

    // Update coupon used count
    await Coupon.findByIdAndUpdate(couponId, {
      $inc: { usedCount: 1 },
    });

    // Create usage record
    const usage = await CouponUsage.create({
      couponId,
      userId,
      orderId,
      discountAmount,
      usedAt: new Date(),
    });

    return usage;
  }
}

const CouponService = new CouponServiceClass();
export default CouponService;