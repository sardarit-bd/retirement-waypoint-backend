
export const processSuccessfulPayment = async (orderId, stripePaymentIntentId) => {
    const { default: OrderService } = await import("./order.service.js");
    const { default: PurchaseService } = await import("../purchase/purchase.service.js");
  
    // 1. Update payment status
    const updatedOrder = await OrderService.updatePaymentStatus(orderId, "PAID", {
      stripePaymentIntentId,
    });
  
    if (updatedOrder.paymentStatus !== "PAID") {
      throw new Error("Failed to update payment status");
    }
  
    // 2. Create purchases
    const result = await PurchaseService.createPurchaseAfterPayment(orderId);
  
    return {
      success: true,
      order: updatedOrder,
      purchases: result.purchases,
    };
  };
  
  /**
   * Prepare order data for Stripe checkout session
   */
  export const prepareOrderForStripe = async (orderId) => {
    const { default: OrderService } = await import("./order.service.js");
    
    const order = await OrderService.getOrderById(orderId);
  
    const lineItems = order.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.bookTitle,
          metadata: {
            bookId: item.bookId,
            orderId: orderId,
          },
        },
        unit_amount: Math.round(item.bookPrice * 100), // Convert to cents
      },
      quantity: 1,
    }));
  
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      lineItems,
      successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?orderId=${order._id}`,
    };
  };