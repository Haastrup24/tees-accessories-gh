// File: /api/process-order.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    customer, cart, paymentMethod, transactionId, 
    region, transporter, subtotal, deliveryFee, total 
  } = req.body;

  // 1. Strict Validation for "Pay Before Delivery"
  if (paymentMethod === 'MTN MoMo (Pay Before Delivery)') {
    // Ghanaian MoMo Transaction IDs are typically 10-12 alphanumeric characters
    const momoRegex = /^[A-Za-z0-9]{10,12}$/;
    if (!transactionId || !momoRegex.test(transactionId)) {
      return res.status(400).json({ 
        error: 'Invalid or missing MoMo Transaction ID. Please check your SMS receipt and try again.' 
      });
    }
  }

  // 2. Format the Order Details for WhatsApp
  const adminPhone = '233267051200'; // Your store WhatsApp number
  let orderSummary = `🛒 *NEW ORDER - TEE'S ACCESSORIES GH*\n\n`;
  orderSummary += `👤 *Customer:* ${customer.fullName}\n`;
  orderSummary += `📞 *Phone:* ${customer.phone}\n`;
  orderSummary += `📍 *Location:* ${customer.address}, ${region}\n`;
  orderSummary += `🚚 *Transporter:* ${transporter}\n\n`;
  
  orderSummary += `📦 *Items:*\n`;
  cart.forEach(item => {
    orderSummary += `• ${item.name} (${item.category}) - GH₵${item.price} x ${item.qty}\n`;
  });
  
  orderSummary += `\n💰 *Subtotal:* GH₵${subtotal}\n`;
  orderSummary += `🚚 *Delivery:* GH₵${deliveryFee}\n`;
  orderSummary += `✅ *TOTAL:* GH₵${total}\n\n`;
  
  orderSummary += `💳 *Payment:* ${paymentMethod}\n`;
  if (paymentMethod.includes('MoMo')) {
    orderSummary += `🧾 *Transaction ID:* ${transactionId}\n`;
  }
  orderSummary += `\n🤖 _Processed by Tee's AI Agent_`;

  // 3. Generate the WhatsApp Deep Link
  // We use encodeURIComponent to ensure all line breaks and special characters render perfectly in WhatsApp
  const encodedMessage = encodeURIComponent(orderSummary);
  const whatsappLink = `https://wa.me/${adminPhone}?text=${encodedMessage}`;

  // 4. Return the link to the frontend
  // The frontend will then automatically open this link or show a "Send via WhatsApp" button
  res.status(200).json({ 
    success: true, 
    whatsappLink,
    orderReference: `TAG-${Date.now().toString(36).toUpperCase()}`
  });
}