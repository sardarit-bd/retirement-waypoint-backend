import crypto from "crypto";
import stripe from "../../config/stripe.js";
import { STRIPE_WEBHOOK_SECRET } from "../../config/stripe.js";
import ApiError from "../../utils/ApiError.js";
import { FRONTEND_URL } from "../../config/stripe.js";
import { Order } from "../order/order.model.js";
import { OrderItem } from "../order/orderItem.model.js";
import OrderService from "../order/order.service.js";
import PurchaseService from "../purchase/purchase.service.js";
import InvoiceService from "../invoice/invoice.service.js";
import { Book } from "../book/book.model.js";
import { sendEmail } from "../../config/mailer.js";

class PaymentServiceClass {
  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(orderId, userId) {
    // Get order with items
    const order = await OrderService.getOrderById(orderId);

    // Verify order belongs to user (only for registered user orders)
    if (!order.isGuest && order.userId !== userId) {
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

    // Create checkout session parameters
    const sessionParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${FRONTEND_URL}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
      metadata: {
        orderId: String(orderId),
        userId: String(userId || order.userId || ""),
        isGuest: String(!!order.isGuest),
        guestEmail: String(order.guestEmail || ""),
      },
      client_reference_id: String(orderId),
    };

    // Prefill customer email for guest checkouts
    if (order.isGuest && order.guestEmail) {
      sessionParams.customer_email = order.guestEmail;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

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
  // async retryPayment(orderId, userId) {
  //   // Using static import - NO dynamic import
  //   const order = await OrderService.getOrderById(orderId);

  //   // Verify order belongs to user
  //   if (order.userId !== userId) {
  //     throw new ApiError(403, "You don't have permission to retry this order");
  //   }

  //   // Verify order is failed
  //   if (order.paymentStatus !== "FAILED") {
  //     throw new ApiError(
  //       400,
  //       `Cannot retry payment for order with status: ${order.paymentStatus}`,
  //     );
  //   }

  //   // Create new checkout session
  //   return this.createCheckoutSession(orderId, userId);
  // }

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

    // Generate secure download token if order is guest
    let downloadToken = null;
    let downloadTokenExpiresAt = null;

    if (existingOrder.isGuest) {
      downloadToken = crypto.randomBytes(32).toString("hex");
      downloadTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

      await Order.findByIdAndUpdate(orderId, {
        $set: {
          downloadToken,
          downloadTokenExpiresAt,
        },
      });

      updatedOrder.downloadToken = downloadToken;
      updatedOrder.downloadTokenExpiresAt = downloadTokenExpiresAt;
    }

    // Generate single-use review token (30 days validity)
    const reviewToken = crypto.randomBytes(24).toString("hex");
    const reviewTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        reviewToken,
        reviewTokenExpiresAt,
      },
    });

    updatedOrder.reviewToken = reviewToken;
    updatedOrder.reviewTokenExpiresAt = reviewTokenExpiresAt;

    // Create purchases
    const purchaseResult =
      await PurchaseService.createPurchaseAfterPayment(orderId);

    // Using static import - NO dynamic import
    const invoice = await InvoiceService.createInvoice(orderId);

    // RECORD COUPON USAGE
    if (updatedOrder.couponId && updatedOrder.userId) {
      await OrderService.recordCouponUsageAfterPayment(
        orderId,
        updatedOrder.userId,
      );
    }

    // Send fulfillment confirmation email
    try {
      let recipientEmail = existingOrder.guestEmail;
      let recipientName = existingOrder.guestName || "Valued Reader";

      if (!existingOrder.isGuest && existingOrder.userId) {
        const user = await AuthService.getAuthUserById(existingOrder.userId);
        if (user) {
          recipientEmail = user.email;
          recipientName = user.name || recipientName;
        }
      }

      if (recipientEmail) {
        const orderItems = await OrderItem.find({ orderId: existingOrder._id });
        let bookSlug = null;
        if (orderItems.length > 0) {
          const firstBook = await Book.findById(orderItems[0].bookId).select("slug");
          if (firstBook) bookSlug = firstBook.slug;
        }

        const itemsListHtml = orderItems
          .map(
            (item) =>
              `<tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.bookTitle}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.bookPrice || 0).toFixed(2)}</td>
              </tr>`
          )
          .join("");

        const downloadSectionHtml = downloadToken
          ? `<div style="margin: 24px 0; padding: 20px; background-color: #f7f3eb; border-radius: 8px; border: 1px solid #C9A84C;">
              <h3 style="color: #1B2B4B; margin-top: 0; font-size: 18px;">Your Book is Ready to Download</h3>
              <p style="color: #444; font-size: 14px; margin-bottom: 16px;">
                Thank you for your purchase! Click the button below to download your digital book (link valid for 7 days):
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${FRONTEND_URL}/payment/success?orderId=${existingOrder._id}&token=${downloadToken}" 
                   style="background-color: #C9A84C; color: #1B2B4B; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
                   Download Book (PDF)
                </a>
              </div>
              <p style="font-size: 12px; color: #777; margin-bottom: 0; text-align: center;">
                If the button above does not work, copy and paste this URL into your browser:<br/>
                <a href="${FRONTEND_URL}/payment/success?orderId=${existingOrder._id}&token=${downloadToken}" style="color: #1B2B4B; word-break: break-all;">
                  ${FRONTEND_URL}/payment/success?orderId=${existingOrder._id}&token=${downloadToken}
                </a>
              </p>
            </div>`
          : `<div style="margin: 24px 0; padding: 20px; background-color: #f7f3eb; border-radius: 8px;">
              <p style="color: #444; font-size: 14px; margin-bottom: 16px;">
                Your digital book is now available in your account library. You can read or download it anytime:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${FRONTEND_URL}/dashboard/my-books" 
                   style="background-color: #1B2B4B; color: #ffffff; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">
                   Go to My Books
                </a>
              </div>
            </div>`;

        const reviewSectionHtml = (reviewToken && bookSlug)
          ? `<div style="margin: 24px 0; padding: 20px; background-color: #fdfbf7; border-radius: 8px; border: 1px solid #C9A84C; text-align: center;">
              <h3 style="color: #1B2B4B; margin-top: 0; font-size: 18px;">Enjoying your purchase?</h3>
              <p style="color: #555; font-size: 14px; margin-bottom: 16px;">
                Leave a verified review for fellow readers! Click below to share your feedback directly:
              </p>
              <div style="text-align: center; margin: 16px 0;">
                <a href="${FRONTEND_URL}/book/${bookSlug}?reviewToken=${reviewToken}&orderId=${existingOrder._id}#reviews" 
                   style="background-color: #1B2B4B; color: #ffffff; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px;">
                   Write a Review
                </a>
              </div>
              <p style="font-size: 12px; color: #777; margin-bottom: 0;">
                Direct passwordless link valid for 30 days.
              </p>
            </div>`
          : "";

        await sendEmail({
          to: recipientEmail,
          subject: `Order Confirmation - #${existingOrder.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #1B2B4B; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Retirement Waypoint</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="color: #1B2B4B; margin-top: 0;">Thank You for Your Order!</h2>
                <p>Hi ${recipientName},</p>
                <p>We've received your payment. Here is a summary of your order:</p>
                
                <div style="background-color: #fafafa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Order Number:</strong> ${existingOrder.orderNumber}</p>
                  <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="margin: 4px 0;"><strong>Payment Status:</strong> Paid</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="padding: 10px; text-align: left; font-size: 14px;">Item</th>
                      <th style="padding: 10px; text-align: right; font-size: 14px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsListHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style="padding: 12px 10px; font-weight: bold; text-align: right; border-top: 2px solid #ddd;">Total:</td>
                      <td style="padding: 12px 10px; font-weight: bold; text-align: right; border-top: 2px solid #ddd; color: #1B2B4B;">$${Number(existingOrder.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                ${downloadSectionHtml}

                ${reviewSectionHtml}

                <p style="font-size: 13px; color: #888; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
                  If you have any questions or need support, please contact us at support@retirementwaypoint.com.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`✅ Order fulfillment email sent to ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error("❌ Failed to send order fulfillment email:", emailError.message);
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

  /**
  * Retry payment for failed or pending order
  */
  async retryPayment(orderId, userId) {
    // 1. Get order with items
    const order = await OrderService.getOrderById(orderId);

    // 2. Verify order belongs to user
    if (order.userId !== userId) {
      throw new ApiError(403, "You don't have permission to retry this order");
    }

    // 3. Check if order can be retried
    if (order.paymentStatus === "PAID" && order.orderStatus === "COMPLETED") {
      throw new ApiError(400, "Order is already paid and completed");
    }

    if (order.orderStatus === "CANCELLED" && order.paymentStatus !== "FAILED") {
      throw new ApiError(400, "Cancelled orders cannot be retried");
    }

    // 4. Check if order has items
    if (!order.items || order.items.length === 0) {
      throw new ApiError(400, "No items found in this order");
    }

    // 5. Build line items for Stripe from order items
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.bookTitle,
          metadata: {
            bookId: item.bookId,
            orderId: order._id.toString(),
          },
        },
        unit_amount: Math.round(item.bookPrice * 100),
      },
      quantity: 1,
    }));

    // 6. Create new Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${FRONTEND_URL}/payment/success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel?orderId=${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId,
        isRetry: "true",
      },
      client_reference_id: order._id.toString(),
    });

    // 7. Update order with new session ID and checkout URL
    const updateData = {
      stripeSessionId: session.id,
      checkoutUrl: session.url,
    };

    // Reset payment status if failed
    if (order.paymentStatus === "FAILED") {
      updateData.paymentStatus = "PENDING";
    }

    await Order.findByIdAndUpdate(orderId, {
      $set: updateData,
    });

    // 8. Return checkout URL
    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Verify session after checkout redirect and return order and download info
   */
  async verifySession(sessionId, orderId) {
    if (!sessionId && !orderId) {
      throw new ApiError(400, "session_id or orderId is required");
    }

    let order = null;

    // 1. If sessionId is provided, retrieve Stripe session and verify
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const resolvedOrderId =
          session.metadata?.orderId || session.client_reference_id || orderId;

        if (resolvedOrderId) {
          order = await Order.findById(resolvedOrderId);
        }

        // If Stripe session is paid, ensure order is fulfilled
        if (session.payment_status === "paid" && order) {
          if (order.paymentStatus !== "PAID") {
            await this.handlePaymentSuccess(session);
            order = await Order.findById(resolvedOrderId);
          }
        }
      } catch (error) {
        console.error("Stripe session retrieval error:", error.message);
      }
    }

    // 2. If order not resolved yet, lookup by orderId
    if (!order && orderId) {
      order = await Order.findById(orderId);
      if (order && order.stripeSessionId && order.paymentStatus !== "PAID") {
        try {
          const session = await stripe.checkout.sessions.retrieve(
            order.stripeSessionId
          );
          if (session.payment_status === "paid") {
            await this.handlePaymentSuccess(session);
            order = await Order.findById(orderId);
          }
        } catch (error) {
          console.error("Stripe session check error:", error.message);
        }
      }
    }

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Ensure order has an active download token if PAID
    if (order.paymentStatus === "PAID") {
      let needsSave = false;
      const isExpired =
        order.downloadTokenExpiresAt &&
        new Date() > order.downloadTokenExpiresAt;
      if (!order.downloadToken || isExpired) {
        order.downloadToken = crypto.randomBytes(32).toString("hex");
        order.downloadTokenExpiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ); // 7 days
        needsSave = true;
      }

      // Ensure reviewToken exists if review not yet submitted
      if (!order.isReviewSubmitted) {
        const isReviewExpired =
          order.reviewTokenExpiresAt &&
          new Date() > order.reviewTokenExpiresAt;
        if (!order.reviewToken || isReviewExpired) {
          order.reviewToken = crypto.randomBytes(24).toString("hex");
          order.reviewTokenExpiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ); // 30 days
          needsSave = true;
        }
      }

      if (needsSave) {
        await order.save();
      }
    }

    // Get order items and book details
    const orderItems = await OrderItem.find({ orderId: order._id });
    let book = null;
    if (orderItems.length > 0) {
      book = await Book.findById(orderItems[0].bookId).select(
        "title slug coverImage authorName"
      );
    }

    const downloadUrl = order.downloadToken
      ? `/api/public/books/download?token=${order.downloadToken}${
          book ? `&bookId=${book._id}` : ""
        }`
      : null;

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      isGuest: order.isGuest,
      guestEmail: order.guestEmail,
      guestName: order.guestName || null,
      downloadToken: order.downloadToken,
      downloadUrl,
      reviewToken: order.isReviewSubmitted ? null : order.reviewToken,
      isReviewSubmitted: !!order.isReviewSubmitted,
      book: book
        ? {
            id: book._id,
            title: book.title,
            slug: book.slug,
            coverImage: book.coverImage,
            authorName: book.authorName,
          }
        : null,
    };
  }
}

const PaymentService = new PaymentServiceClass();
export default PaymentService;