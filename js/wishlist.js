function getWishlist() {
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return Array.isArray(wishlist) ? wishlist : [];
    } catch {
        return [];
    }
}

function saveWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function formatWishlistMoney(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function syncWishlistButtons() {
    const savedIds = new Set(getWishlist().map(item => String(item.id)));
    document.querySelectorAll('.product-card').forEach(card => {
        const button = card.querySelector('.action-btn .fa-heart')?.closest('button');
        if (!button) return;
        const isSaved = savedIds.has(card.dataset.productId);
        button.classList.toggle('is-saved', isSaved);
        button.setAttribute('aria-label', isSaved ? 'Remove from wishlist' : 'Add to wishlist');
        button.querySelector('i')?.classList.toggle('fas', isSaved);
        button.querySelector('i')?.classList.toggle('far', !isSaved);
    });
}

function addToWishlist(productId) {
    const wishlist = getWishlist();
    const product = (window.products || []).find(item => item.id === String(productId))
        || wishlist.find(item => item.id === String(productId));
    if (!product) return;

    const exists = wishlist.some(item => item.id === product.id);
    saveWishlist(exists
        ? wishlist.filter(item => item.id !== product.id)
        : [...wishlist, product]);
    syncWishlistButtons();
    displayWishlist();
    if (typeof showStoreNotice === 'function') {
        showStoreNotice(exists ? 'Removed from wishlist.' : `${product.name} added to wishlist.`);
    }
}

function displayWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;

    const wishlist = getWishlist();
    if (!wishlist.length) {
        container.innerHTML = '<p class="empty-state">Your wishlist is empty. Save a piece from the collection to find it here.</p>';
        return;
    }

    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    container.innerHTML = wishlist.map(item => `
        <article class="cart-item">
            <img src="${escape(item.image)}" alt="${escape(item.alt || item.name)}">
            <div class="cart-item-details">
                <h2>${escape(item.name)}</h2>
                <p>${escape(item.category)} · ${formatWishlistMoney(item.price)}</p>
                <button type="button" onclick="addToWishlist('${escape(item.id)}')">Remove from wishlist</button>
                <button type="button" onclick="addToCart('${escape(item.id)}')">Add to cart</button>
            </div>
        </article>
    `).join('');
}

syncWishlistButtons();
displayWishlist();