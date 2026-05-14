import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
const adminWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER;
const appUrl = process.env.APP_URL || 'http://localhost:5173';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';

let client: twilio.Twilio | null = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

const formatPaymentMethod = (method: string) => {
  if (method === 'COD') return 'Cash on Delivery';
  if (method === 'JAZZCASH') return 'JazzCash/EasyPaisa';
  if (method === 'CARD') return 'Credit Card';
  return method;
};

export const sendOrderConfirmationToCustomer = async (order: any, customerPhone: string) => {
  if (!client || !fromWhatsApp) {
    console.warn("WhatsApp service not configured string");
    return;
  }

  try {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const customerName = order.guestName || (order.user ? order.user.name : "Customer");
    let city = "Unknown City";
    let province = "Unknown Province";
    if (order.shippingAddress) {
      try {
        const addr = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
        city = addr.city || city;
        province = addr.province || province;
      } catch(e) {}
    }

    const itemsList = order.items.map((i: any) => `• ${i.product.name} x${i.quantity} — Rs.${i.price}`).join('\n');

    const messageBody = `🛍️ *Kiswa — Order Confirmed!*\n\nAssalam u Alaikum ${customerName}!\n\nYour order has been successfully placed. ✅\n\n📦 *Order ID:* KSW-${shortId}\n💰 *Total:* Rs. ${order.totalAmount.toLocaleString()}\n💳 *Payment:* ${formatPaymentMethod(order.paymentMethod)}\n🏠 *Delivery to:* ${city}, ${province}\n⏱️ *Estimated Delivery:* 3-5 business days\n\n*Items Ordered:*\n${itemsList}\n\nTrack your order: ${appUrl}/track-order?id=${order.id}\n\nThank you for shopping with Kiswa! 🖤\nFor help, reply to this message.`;

    await client.messages.create({
      body: messageBody,
      from: fromWhatsApp,
      to: customerPhone.startsWith('whatsapp:') ? customerPhone : `whatsapp:${customerPhone}`
    });
    console.log(`WhatsApp sent to customer: ${customerPhone}`);
  } catch (error) {
    console.error(`WhatsApp notification failed for order ${order.id}:`, error);
  }
};

export const sendNewOrderAlertToAdmin = async (order: any) => {
  if (!client || !fromWhatsApp || !adminWhatsApp) {
    console.warn("WhatsApp service not configured for Admin");
    return;
  }

  try {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const customerName = order.guestName || (order.user ? order.user.name : "Customer");
    const customerPhone = order.guestPhone || "N/A";
    
    let city = "Unknown City";
    let province = "Unknown Province";
    if (order.shippingAddress) {
      try {
        const addr = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
        city = addr.city || city;
        province = addr.province || province;
      } catch(e) {}
    }

    const itemsList = order.items.map((i: any) => `• ${i.product.name} x${i.quantity} — Rs.${i.price}`).join('\n');

    const messageBody = `🚨 *New Order — Kiswa*\n\n📦 Order ID: KSW-${shortId}\n👤 Customer: ${customerName}\n📱 Phone: ${customerPhone}\n💰 Amount: Rs. ${order.totalAmount.toLocaleString()}\n💳 Payment: ${formatPaymentMethod(order.paymentMethod)}\n📍 City: ${city}, ${province}\n\n🛍️ *Items:*\n${itemsList}\n\n⚡ Action needed: Review in Admin Dashboard\n${adminUrl}/admin/orders`;

    await client.messages.create({
      body: messageBody,
      from: fromWhatsApp,
      to: adminWhatsApp.startsWith('whatsapp:') ? adminWhatsApp : `whatsapp:${adminWhatsApp}`
    });
    console.log(`WhatsApp sent to admin: ${adminWhatsApp}`);
  } catch (error) {
    console.error(`WhatsApp alert failed for admin on order ${order.id}:`, error);
  }
};

export const sendOrderStatusUpdate = async (order: any, customerPhone: string, status: string) => {
  if (!client || !fromWhatsApp) {
    console.warn("WhatsApp service not configured");
    return;
  }
  
  // Only send for specific statuses
  if (!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
    return;
  }

  try {
    const shortId = order.id.slice(0, 8).toUpperCase();
    let messageBody = '';

    if (status === 'SHIPPED') {
      messageBody = `📦 *Kiswa — Order Shipped!*\n\nYour order KSW-${shortId} has been shipped! 🚚\n\nCourier: Leopard Couriers\nEst. Delivery: 1-2 business days\n\nTrack: ${appUrl}/track-order?id=${order.id}\n\nKiswa 🖤`;
    } else if (status === 'DELIVERED') {
      const productSlug = order.items && order.items.length > 0 && order.items[0].product ? order.items[0].product.slug : '';
      messageBody = `✅ *Kiswa — Order Delivered!*\n\nYour order KSW-${shortId} has been delivered!\n\nWe hope you love your purchase. 🖤\n${productSlug ? `Please leave a review: ${appUrl}/product/${productSlug}\n\n` : ''}Thank you for choosing Kiswa!`;
    } else if (status === 'CANCELLED') {
      messageBody = `❌ *Kiswa — Order Cancelled*\n\nYour order KSW-${shortId} has been cancelled.\n\nIf you have questions, contact us:\nWhatsApp: +92 329 7939629\nEmail: hurairahrajpoot219@gmail.com\n\nWe hope to serve you again. 🖤`;
    }

    if (messageBody) {
      await client.messages.create({
        body: messageBody,
        from: fromWhatsApp,
        to: customerPhone.startsWith('whatsapp:') ? customerPhone : `whatsapp:${customerPhone}`
      });
      console.log(`WhatsApp ${status} update sent to customer: ${customerPhone}`);
    }
  } catch (error) {
    console.error(`WhatsApp notification failed for order ${order.id}:`, error);
  }
};
