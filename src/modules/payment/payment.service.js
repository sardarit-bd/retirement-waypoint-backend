import stripe from "../../config/stripe.js";
import { STRIPE_WEBHOOK_SECRET } from "../../config/stripe.js";
import ApiError from "../../utils/ApiError.js";
import { FRONTEND_URL } from "../../config/stripe.js";
import { Order } from "../order/order.model.js";
import OrderService from "../order/order.service.js";
import PurchaseService from "../purchase/purchase.service.js";
import InvoiceService from "../invoice/invoice.service.js";

class PaymentServiceClass {
  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(orderId, userId) {
    // Get order with items
    const order = await OrderService.getOrderById(orderId);

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to pay for this order",
      );
    }

    // Verify order is pending
    if (order.paymentStatus !== "PENDING") {
      throw new ApiError(
        400,
        `Order payment status is ${order.paymentStatus}, cannot create checkout`,
      );
    }

    // Build line items from order items
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.bookTitle,
          metadata: {
            bookId: item.bookId,
            orderId,
          },
        },
        unit_amount: Math.round(order.totalAmount * 100),
      },
      quantity: 1,
    }));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${FRONTEND_URL}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
      metadata: {
        orderId,
        userId,
      },
      client_reference_id: orderId,
    });

    // Save stripe session ID to order
    await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          stripeSessionId: session.id,
        },
      },
      { new: true },
    );

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Retry payment for failed order
   */
  async retryPayment(orderId, userId) {
    // Using static import - NO dynamic import
    const order = await OrderService.getOrderById(orderId);

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new ApiError(403, "You don't have permission to retry this order");
    }

    // Verify order is failed
    if (order.paymentStatus !== "FAILED") {
      throw new ApiError(
        400,
        `Cannot retry payment for order with status: ${order.paymentStatus}`,
      );
    }

    // Create new checkout session
    return this.createCheckoutSession(orderId, userId);
  }

  /**
   * Handle successful payment (called from webhook)
   */
  async handlePaymentSuccess(session) {
    const orderId = session.metadata?.orderId || session.client_reference_id;

    if (!orderId) {
      throw new Error("Order ID not found in session metadata");
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (existingOrder.paymentStatus === "PAID") {
      console.log(`⚠️ Order ${orderId} already paid, skipping webhook`);
      return {
        success: true,
        message: "Order already processed",
        order: existingOrder,
      };
    }

    // Update order
    const updatedOrder = await OrderService.updatePaymentStatus(
      orderId,
      "PAID",
      {
        stripePaymentIntentId: session.payment_intent,
      },
    );

    await OrderService.updateOrderStatus(orderId, "COMPLETED");

    // Create purchases
    const purchaseResult =
      await PurchaseService.createPurchaseAfterPayment(orderId);

    // Using static import - NO dynamic import
    const invoice = await InvoiceService.createInvoice(orderId);

    // RECORD COUPON USAGE
    if (updatedOrder.couponId) {
      await OrderService.recordCouponUsageAfterPayment(
        orderId,
        updatedOrder.userId,
      );
    }

    return {
      success: true,
      message: "Payment processed successfully",
      order: updatedOrder,
      purchases: purchaseResult.purchases,
      invoice,
    };
  }

  /**
   * Handle payment failure (called from webhook)
   */
  async handlePaymentFailure(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      throw new Error("Order ID not found in payment intent metadata");
    }

    // Update payment status to FAILED
    const order = await OrderService.updatePaymentStatus(orderId, "FAILED");

    // Update order status to CANCELLED
    await OrderService.updateOrderStatus(orderId, "CANCELLED");

    return {
      success: true,
      message: "Payment failed, order cancelled",
      order,
    };
  }

  /**
   * Handle refund (called from webhook)
   */
  async handleRefund(charge) {
    // Find order by payment intent
    const order = await Order.findOne({
      stripePaymentIntentId: charge.payment_intent,
    });

    if (!order) {
      throw new Error(
        `Order not found for payment intent: ${charge.payment_intent}`,
      );
    }

    // Update order status
    await OrderService.updatePaymentStatus(order._id, "REFUNDED");
    await OrderService.updateOrderStatus(order._id, "REFUNDED");

    // Revoke all purchases for this order
    const purchases = await PurchaseService.getPurchasesByOrder(order._id);

    for (const purchase of purchases) {
      await PurchaseService.revokeAccess(purchase._id);
    }

    return {
      success: true,
      message: `Refund processed for order ${order.orderNumber}`,
      order,
      revokedPurchases: purchases.length,
    };
  }

  /**
   * Verify Stripe webhook signature
   */
  async verifyWebhookSignature(rawBody, signature) {
    if (!signature) {
      throw new ApiError(400, "Stripe signature is required");
    }

    try {
      // Use the already imported stripe instance
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );

      return event;
    } catch (error) {
      throw new ApiError(400, `Invalid webhook signature: ${error.message}`);
    }
  }
}

const PaymentService = new PaymentServiceClass();
export default PaymentService;