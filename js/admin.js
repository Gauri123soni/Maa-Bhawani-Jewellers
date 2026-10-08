async function updateRate() {
    const metal = document.getElementById('adminMetal')?.value;
    const purity = document.getElementById('adminPurity')?.value || '24';
    const rate = Number(document.getElementById('adminRate')?.value);
    const message = document.getElementById('adminMessage');
    if (!message) return;
    if (!Number.isFinite(rate) || rate <= 0) {
        message.textContent = 'Enter a valid positive rate.';
        return;
    }

    try {
        const response = await fetch('/api/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metal, purity, rate })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to update rate.');
        message.textContent = data.message;
    } catch (error) {
        message.textContent = error.message || 'Unable to update rate.';
    }
}

async function trackOrder() {
    const code = document.getElementById('orderCode')?.value.trim();
    const result = document.getElementById('trackingResult');
    if (!result) return;
    result.textContent = '';
    if (!code) {
        result.textContent = 'Enter an order code.';
        return;
    }

    try {
        const response = await fetch(`/api/orders/${encodeURIComponent(code)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Order not found.');
        const order = data.order;
        const summary = document.createElement('div');
        summary.innerHTML = '<h3>Order found</h3>';
        [
            `Order: ${order.orderCode}`,
            `Status: ${order.status}`,
            `Total: ₹${Number(order.total).toLocaleString('en-IN')}`
        ].forEach(text => {
            const line = document.createElement('p');
            line.textContent = text;
            summary.append(line);
        });
        result.replaceChildren(summary);
    } catch (error) {
        result.textContent = error.message || 'Unable to look up this order.';
    }
}

const initialOrderCode = new URLSearchParams(window.location.search).get('order');
const orderCodeInput = document.getElementById('orderCode');
if (initialOrderCode && orderCodeInput) {
    orderCodeInput.value = initialOrderCode;
    trackOrder();
}