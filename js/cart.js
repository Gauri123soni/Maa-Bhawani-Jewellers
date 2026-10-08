function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function formatCartMoney(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function cartProduct(productId) {
    const id = String(productId);
    const catalogProduct = (window.products || []).find(product => product.id === id);
    if (catalogProduct) return catalogProduct;
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return Array.isArray(wishlist) ? wishlist.find(product => product.id === id) : undefined;
    } catch {
        return undefined;
    }
}

function addToCart(productId) {
    const product = cartProduct(productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
    else cart.push({ ...product, quantity: 1 });

    saveCart(cart);
    updateCartCount();
    showStoreNotice(`${product.name} added to cart.`);
}

function updateCartCount() {
    const count = getCart().reduce((total, item) => total + Number(item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = String(count);
        element.setAttribute('aria-label', `${count} items in cart`);
    });
}

function displayCart() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    const cart = getCart();
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-state">Your cart is empty. Browse the collection to add jewellery.</p>';
        return;
    }

    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

    container.innerHTML = cart.map(item => `
        <article class="cart-item">
            <img src="${escape(item.image)}" alt="${escape(item.alt || item.name)}">
            <div class="cart-item-details">
                <h2>${escape(item.name)}</h2>
                <p>${escape(item.category)} · ${formatCartMoney(item.price)}</p>
                <div class="cart-item-controls">
                    <button type="button" onclick="changeCartQuantity('${escape(item.id)}', -1)" aria-label="Decrease quantity">−</button>
                    <span>${Number(item.quantity || 1)}</span>
                    <button type="button" onclick="changeCartQuantity('${escape(item.id)}', 1)" aria-label="Increase quantity">+</button>
                    <button type="button" onclick="removeFromCart('${escape(item.id)}')">Remove</button>
                </div>
            </div>
            <strong>${formatCartMoney(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
        </article>
    `).join('') + `
        <div class="cart-total"><span>Subtotal</span><strong>${formatCartMoney(total)}</strong></div>
        <button class="btn-primary" type="button" onclick="checkoutCart()">Place order and view invoice</button>
    `;
}

async function checkoutCart() {
    const cart = getCart();
    if (!cart.length) return;

    const button = document.querySelector('#cartContainer .btn-primary');
    if (button) {
        button.disabled = true;
        button.textContent = 'Creating order...';
    }

    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('mbjUser') || '{}');
    } catch {
        user = {};
    }

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer: user.name || 'Guest', email: user.email || '', items: cart })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to place your order.');
        localStorage.setItem('lastOrder', JSON.stringify(data.order));
        saveCart([]);
        updateCartCount();
        window.location.href = `invoice.html?order=${encodeURIComponent(data.order.orderCode)}`;
    } catch (error) {
        showStoreNotice(error.message || 'Unable to place your order.');
        if (button) {
            button.disabled = false;
            button.textContent = 'Place order and view invoice';
        }
    }
}

function changeCartQuantity(productId, difference) {
    const cart = getCart();
    const item = cart.find(product => product.id === String(productId));
    if (!item) return;
    item.quantity = Number(item.quantity || 1) + difference;
    saveCart(cart.filter(product => product.quantity > 0));
    updateCartCount();
    displayCart();
}

function removeFromCart(productId) {
    saveCart(getCart().filter(item => item.id !== String(productId)));
    updateCartCount();
    displayCart();
}

function showStoreNotice(message) {
    let notice = document.getElementById('storeNotice');
    if (!notice) {
        notice = document.createElement('p');
        notice.id = 'storeNotice';
        notice.setAttribute('role', 'status');
        notice.className = 'store-notice';
        document.body.append(notice);
    }
    notice.textContent = message;
    notice.classList.add('visible');
    window.clearTimeout(showStoreNotice.timer);
    showStoreNotice.timer = window.setTimeout(() => notice.classList.remove('visible'), 2200);
}

updateCartCount();
displayCart();