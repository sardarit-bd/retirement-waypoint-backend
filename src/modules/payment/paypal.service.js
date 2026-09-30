import {
  PAYPAL_API_BASE,
  PAYPAL_WEBHOOK_ID,
  getPayPalAccessToken,
  isPayPalConfigured,
} from "../../config/paypal.js";
import ApiError from "../../utils/ApiError.js";
import { Order } from "../order/order.model.js";
import OrderService from "../order/order.service.js";
import PaymentService from "./payment.service.js";
import PurchaseService from "../purchase/purchase.service.js";

class PayPalServiceClass {
  /**
   * Create PayPal Order using PayPal Orders REST API v2
   * @param {string} orderId - Database Order ObjectId
   * @param {string|null} userId - Current authenticated user ID (null for guests)
   * @returns {Promise<{paypalOrderId: string, orderId: string, orderNumber: string, totalAmount: number}>}
   */
  async createOrder(orderId, userId = null) {
    if (!orderId) {
      throw new ApiError(400, "Order ID is required to create a PayPal payment");
    }

    // 1. Fetch authoritative order from database with items
    const order = await OrderService.getOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // 2. Verify ownership for authenticated orders
    if (!order.isGuest && order.userId && userId && order.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to initiate payment for this order"
      );
    }

    // 3. Verify order payment status is PENDING
    if (order.paymentStatus !== "PENDING") {
      throw new ApiError(
        400,
        `Cannot create payment session for order with status: ${order.paymentStatus}`
      );
    }

    // 4. Ensure totalAmount is valid
    const totalAmount = Number(order.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new ApiError(400, "Invalid order total amount");
    }
    const formattedAmount = totalAmount.toFixed(2);

    // 5. Get PayPal OAuth2 Access Token
    const accessToken = await getPayPalAccessToken();

    // 6. Build purchase unit with item details and authoritative total
    const purchaseUnit = {
      reference_id: order._id.toString(),
      custom_id: order._id.toString(),
      description: `Retirement Waypoint - Order #${order.orderNumber}`,
      amount: {
        currency_code: "USD",
        value: formattedAmount,
      },
    };

    const requestBody = {
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: "Retirement Waypoint",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
      },
    };

    // 7. Call PayPal Orders v2 API
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ PayPal Create Order Error:", response.status, responseData);
      const errorDetail =
        responseData.details?.[0]?.description ||
        responseData.message ||
        "Failed to create PayPal order";
      throw new ApiError(502, `PayPal error: ${errorDetail}`);
    }

    const paypalOrderId = responseData.id;

    // 8. Record paypalOrderId and paymentMethod on the order in MongoDB
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        paypalOrderId,
        paymentMethod: "paypal",
      },
    });

    console.log(
      `✅ PayPal order created: ${paypalOrderId} for internal order #${order.orderNumber}`
    );

    return {
      paypalOrderId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    };
  }

  /**
   * Capture PayPal Order payment after buyer approval
   * @param {string} paypalOrderId - PayPal Order ID from client SDK
   * @param {string} orderId - Internal Order ID
   * @param {string|null} userId - Current authenticated user ID
   * @returns {Promise<object>}
   */
  async captureOrder(paypalOrderId, orderId, userId = null) {
    if (!paypalOrderId) {
      throw new ApiError(400, "PayPal Order ID is required for capture");
    }

    // 1. Locate order by orderId or paypalOrderId
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ paypalOrderId });
    }

    if (!order) {
      throw new ApiError(404, "Corresponding application order not found");
    }

    // 2. Check if already fulfilled (Idempotency)
    if (order.paymentStatus === "PAID") {
      console.log(
        `⚠️ Order #${order.orderNumber} already marked PAID. Returning existing details.`
      );
      return PaymentService.verifySession(null, order._id);
    }

    // 3. Verify user ownership if registered
    if (!order.isGuest && order.userId && userId && order.userId !== userId) {
      throw new ApiError(403, "You do not have permission to capture this order");
    }

    // 4. Get PayPal OAuth2 Token
    const accessToken = await getPayPalAccessToken();

    // 5. Execute Capture against PayPal API
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await response.json();

    if (!response.ok) {
      console.error("❌ PayPal Capture Order Error:", response.status, captureData);
      
      // If order was already captured in PayPal, retrieve details to verify
      if (
        captureData.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED" ||
        captureData.name === "UNPROCESSABLE_ENTITY"
      ) {
        console.log("ℹ️ Order already captured on PayPal, attempting recovery...");
        return await this.syncOrderFromPayPal(paypalOrderId, order._id);
      }

      const errorDetail =
        captureData.details?.[0]?.description ||
        captureData.message ||
        "Failed to capture PayPal payment";
      throw new ApiError(502, `PayPal Capture Error: ${errorDetail}`);
    }

    // 6. Verify capture status and amounts
    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    const captureStatus = capture?.status || captureData.status;
    if (captureStatus !== "COMPLETED") {
      console.warn(`⚠️ PayPal capture status is ${captureStatus}`);
      if (captureStatus === "DENIED" || captureStatus === "FAILED") {
        await OrderService.updatePaymentStatus(order._id, "FAILED");
        await OrderService.updateOrderStatus(order._id, "CANCELLED");
        throw new ApiError(400, "Payment was declined or cancelled by PayPal");
      }
      // Pending state
      return {
        success: false,
        status: "PENDING",
        message: "Payment is pending PayPal confirmation",
        orderId: order._id,
      };
    }

    // 7. Verify captured amount against authoritative order total
    const capturedValue = parseFloat(capture?.amount?.value || "0");
    const expectedValue = parseFloat(order.totalAmount.toFixed(2));
    const capturedCurrency = capture?.amount?.currency_code;

    if (capturedCurrency !== "USD" || Math.abs(capturedValue - expectedValue) > 0.01) {
      console.error(
        `🚨 AMOUNT MISMATCH: Captured ${capturedCurrency} ${capturedValue} vs Expected USD ${expectedValue}`
      );
      throw new ApiError(
        400,
        "Security validation failed: Captured payment amount does not match order total"
      );
    }

    const captureId = capture?.id;
    const payerEmail =
      captureData.payer?.email_address ||
      captureData.payment_source?.paypal?.email_address ||
      order.guestEmail;

    // 8. Fulfill the order using the unified fulfillment engine
    const fulfillmentResult = await PaymentService.fulfillPaidOrder(order._id, {
      paymentMethod: "paypal",
      paypalOrderId,
      paypalCaptureId: captureId,
      paypalPayerEmail: payerEmail,
    });

    console.log(`✅ PayPal payment successfully captured and fulfilled for #${order.orderNumber}`);

    // 9. Return download token and order details
    const sessionDetails = await PaymentService.verifySession(null, order._id);
    return {
      ...fulfillmentResult,
      ...sessionDetails,
    };
  }

  /**
   * Sync and fulfill order if PayPal capture succeeded previously
   */
  async syncOrderFromPayPal(paypalOrderId, orderId) {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new ApiError(502, "Failed to retrieve PayPal order for verification");
    }

    const orderData = await response.json();
    const purchaseUnit = orderData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    if (capture?.status === "COMPLETED" || orderData.status === "COMPLETED") {
      const order = await Order.findById(orderId);
      const payerEmail = orderData.payer?.email_address || order?.guestEmail;
      await PaymentService.fulfillPaidOrder(orderId, {
        paymentMethod: "paypal",
        paypalOrderId,
        paypalCaptureId: capture?.id,
        paypalPayerEmail: payerEmail,
      });
      return PaymentService.verifySession(null, orderId);
    }

    throw new ApiError(400, "PayPal payment was not completed");
  }

  /**
   * Verify PayPal Webhook Signature using official PayPal endpoint
   * @param {object} headers - HTTP request headers
   * @param {object} rawEvent - Parsed JSON webhook body
   * @returns {Promise<boolean>}
   */
  async verifyWebhookSignature(headers, rawEvent) {
    if (!PAYPAL_WEBHOOK_ID) {
      console.warn("⚠️ PAYPAL_WEBHOOK_ID is not configured. Webhook verification skipped in development.");
      return true;
    }

    const transmissionId = headers["paypal-transmission-id"];
    const transmissionTime = headers["paypal-transmission-time"];
    const certUrl = headers["paypal-cert-url"];
    const authAlgo = headers["paypal-auth-algo"];
    const transmissionSig = headers["paypal-transmission-sig"];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error("❌ Missing required PayPal webhook signature headers");
      return false;
    }

    try {
      const accessToken = await getPayPalAccessToken();

      const verificationPayload = {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: rawEvent,
      };

      const response = await fetch(
        `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verificationPayload),
        }
      );

      if (!response.ok) {
        console.error("❌ PayPal Webhook Verification API error:", response.status);
        return false;
      }

      const result = await response.json();
      return result.verification_status === "SUCCESS";
    } catch (err) {
      console.error("❌ Error verifying PayPal webhook signature:", err.message);
      return false;
    }
  }

  /**
   * Process verified PayPal webhook event
   * @param {object} event - Verified PayPal webhook event object
   * @returns {Promise<object>}
   */
  async handleWebhookEvent(event) {
    const eventType = event.event_type;
    console.log(`🔔 PayPal Webhook Received: ${eventType} (${event.id})`);

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const capture = event.resource;
        const customId =
          capture.custom_id ||
          capture.supplementary_data?.related_ids?.order_id;

        let order = null;
        if (customId) {
          order = await Order.findById(customId);
        }
        if (!order && capture.id) {
          order = await Order.findOne({ paypalCaptureId: capture.id });
        }
        if (!order) {
          console.warn(`⚠️ PayPal webhook capture completed: Order not found for ${customId || capture.id}`);
          return { received: true, handled: false };
        }

        if (order.paymentStatus === "PAID") {
          console.log(`ℹ️ Order #${order.orderNumber} already marked PAID. Skipping webhook fulfillment.`);
          return { received: true, alreadyPaid: true };
        }

        await PaymentService.fulfillPaidOrder(order._id, {
          paymentMethod: "paypal",
          paypalCaptureId: capture.id,
          paypalPayerEmail: capture.payer?.email_address || order.guestEmail,
        });

        console.log(`✅ Webhook: Order #${order.orderNumber} fulfilled via PayPal webhook`);
        return { received: true, fulfilled: true };
      }

      case "PAYMENT.CAPTURE.DENIED": {
        const capture = event.resource;
        const customId = capture.custom_id;
        if (customId) {
          await OrderService.updatePaymentStatus(customId, "FAILED");
          await OrderService.updateOrderStatus(customId, "CANCELLED");
          console.log(`❌ Webhook: Order ${customId} payment marked FAILED (Capture Denied)`);
        }
        return { received: true, status: "DENIED" };
      }

      case "PAYMENT.CAPTURE.REFUNDED": {
        const refundResource = event.resource;
        const captureId =
          refundResource.links?.find((l) => l.rel === "up")?.href?.split("/").pop() ||
          refundResource.capture_id;

        let order = null;
        if (captureId) {
          order = await Order.findOne({ paypalCaptureId: captureId });
        }

        if (order) {
          await OrderService.updatePaymentStatus(order._id, "REFUNDED");
          await OrderService.updateOrderStatus(order._id, "REFUNDED");

          const purchases = await PurchaseService.getPurchasesByOrder(order._id);
          for (const purchase of purchases) {
            await PurchaseService.revokeAccess(purchase._id);
          }
          console.log(`🔄 Webhook: Order #${order.orderNumber} marked REFUNDED and purchases revoked`);
        }
        return { received: true, status: "REFUNDED" };
      }

      default: {
        return { received: true, unhandled: true };
      }
    }
  }

  /**
   * Process PayPal Refund for a captured payment
   * @param {string} captureId - PayPal Capture ID
   * @param {number} refundAmount - Amount to refund in USD
   * @param {string} note - Admin note
   * @returns {Promise<object>}
   */
  async refundCapture(captureId, refundAmount, note = "") {
    if (!captureId) {
      throw new ApiError(400, "PayPal Capture ID is required to process refund");
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: {
            value: Number(refundAmount).toFixed(2),
            currency_code: "USD",
          },
          note_to_payer: note || "Refund from Retirement Waypoint",
        }),
      }
    );

    const refundData = await response.json();

    if (!response.ok) {
      console.error("❌ PayPal Refund Error:", response.status, refundData);
      const detail =
        refundData.details?.[0]?.description ||
        refundData.message ||
        "PayPal refund processing failed";
      throw new ApiError(500, `PayPal refund failed: ${detail}`);
    }

    return {
      id: refundData.id,
      status: refundData.status,
    };
  }
}

const PayPalService = new PayPalServiceClass();
export default PayPalService;
