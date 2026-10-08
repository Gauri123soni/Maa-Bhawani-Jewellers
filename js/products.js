function readProductPrice(element) {
    const price = element.querySelector('.product-price');
    const text = price?.childNodes[0]?.textContent || price?.textContent || '0';
    return Number(text.replace(/[^\d]/g, '')) || 0;
}

function showProductDetails(product) {
    let dialog = document.getElementById('productDialog');
    if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'productDialog';
        dialog.className = 'product-dialog';
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
        document.body.append(dialog);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'product-dialog-close';
    close.setAttribute('aria-label', 'Close product details');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.alt;
    const details = document.createElement('div');
    const category = document.createElement('p');
    category.textContent = product.category;
    const title = document.createElement('h2');
    title.textContent = product.name;
    const price = document.createElement('p');
    price.className = 'product-dialog-price';
    price.textContent = `₹${formatNumber(product.price)}`;
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn-primary';
    add.textContent = 'Add to cart';
    add.addEventListener('click', () => {
        addToCart(product.id);
        dialog.close();
    });
    details.append(category, title, price, add);
    dialog.replaceChildren(close, image, details);
    dialog.showModal();
}

window.products = Array.from(document.querySelectorAll('.product-card')).map((card, index) => {
    const image = card.querySelector('.product-img img');
    const category = card.querySelector('.product-category')?.textContent.trim() || 'Jewellery';
    const product = {
        id: String(index + 1),
        name: card.querySelector('.product-name')?.textContent.trim() || 'Jewellery',
        category,
        price: readProductPrice(card),
        image: image?.getAttribute('src') || '',
        alt: image?.getAttribute('alt') || category
    };

    card.dataset.productId = product.id;
    card.querySelector('.quick-add')?.addEventListener('click', () => addToCart(product.id));

    card.querySelectorAll('.action-btn').forEach(button => {
        const icon = button.querySelector('i');
        if (icon?.classList.contains('fa-heart')) {
            button.setAttribute('aria-label', 'Add to wishlist');
            button.addEventListener('click', () => addToWishlist(product.id));
        } else if (icon?.classList.contains('fa-eye')) {
            button.setAttribute('aria-label', 'View product');
            button.addEventListener('click', () => showProductDetails(product));
        } else if (icon?.classList.contains('fa-sync-alt')) {
            button.setAttribute('aria-label', 'Add to cart');
            button.addEventListener('click', () => addToCart(product.id));
        }
    });

    return product;
});