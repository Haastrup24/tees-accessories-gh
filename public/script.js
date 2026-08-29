// --- STATE MANAGEMENT ---
let cart = []; // Assuming you have a cart array populated elsewhere
let cartSubtotal = 0; // Update this whenever cart changes

// --- UI TOGGLES ---
function toggleMoMoField() {
    const momoRadio = document.querySelector('input[value="MTN MoMo (Pay Before Delivery)"]');
    const momoContainer = document.getElementById('momo-id-container');
    momoContainer.style.display = momoRadio.checked ? 'block' : 'none';
}

// --- 1. DYNAMIC DELIVERY CALCULATOR ---
async function calculateDelivery() {
    const region = document.getElementById('region').value;
    const transporter = document.getElementById('transporter').value;

    if (!region || !transporter) return;

    try {
        const response = await fetch('/api/calculate-delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region, transporter, subtotal: cartSubtotal })
        });

        const data = await response.json();

        if (response.ok) {
            // Update the cart summary UI
            document.getElementById('delivery-fee-display').innerText = `GH₵${data.deliveryFee}`;
            document.getElementById('total-display').innerText = `GH₵${data.total}`;
            
            if (data.message) {
                document.getElementById('delivery-fee-display').innerHTML = `<span style="color: green;">FREE</span> <small>(${data.message})</small>`;
            }
        } else {
            alert(data.error);
            // Reset UI if invalid selection
            document.getElementById('delivery-fee-display').innerText = 'GH₵0';
        }
    } catch (error) {
        console.error('Delivery calculation failed:', error);
    }
}

// --- 2. ORDER PROCESSING & AI ROUTING ---
async function submitOrder() {
    const form = document.getElementById('checkout-form'); // Ensure your form has this ID
    const formData = new FormData(form);
    
    // Gather customer data
    const customer = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address')
    };

    const orderData = {
        customer,
        cart,
        paymentMethod: formData.get('payment'),
        transactionId: formData.get('transactionId') || '',
        region: formData.get('region'),
        transporter: formData.get('transporter'),
        subtotal: cartSubtotal,
        // We let the backend calculate the final delivery fee and total for security
    };

    // Trigger the AI Agent UI animation
    showAgentProcessing(true);

    try {
        // Call the Vercel backend
        const response = await fetch('/api/process-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Success! Update UI and route to WhatsApp
            showAgentProcessing(false, true);
            
            // Small delay so the user sees the "Success" UI state
            setTimeout(() => {
                window.open(data.whatsappLink, '_blank');
                // Clear cart after successful routing
                cart = []; 
                cartSubtotal = 0;
                updateCartUI(); 
                closeCheckoutModal();
            }, 1500);
        } else {
            // Backend validation failed (e.g., bad MoMo ID)
            showAgentProcessing(false, false, data.error);
        }
    } catch (error) {
        showAgentProcessing(false, false, 'Network error. Please try again.');
    }
}

// --- 3. AI AGENT UI SIMULATION ---
function showAgentProcessing(isLoading, isSuccess = false, errorMsg = '') {
    const agentModal = document.getElementById('ai-agent-modal'); // Your AI modal ID
    const statusText = document.getElementById('agent-status-text');
    
    agentModal.style.display = 'block';

    if (isLoading) {
        statusText.innerText = '🤖 AI Agent processing your order...';
        // You can add CSS animations here for a loading spinner
    } else if (isSuccess) {
        statusText.innerHTML = '✓ Order routed successfully! <br><small>Opening WhatsApp...</small>';
    } else {
        statusText.innerHTML = `✗ Error: ${errorMsg}`;
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Listen for region changes to recalculate delivery
    document.getElementById('region').addEventListener('change', calculateDelivery);
    
    // Listen for the Place Order button
    document.getElementById('place-order-btn').addEventListener('click', (e) => {
        e.preventDefault();
        submitOrder();
    });
});