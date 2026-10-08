window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const scrollTop = document.getElementById('scrollTop');
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
    scrollTop?.classList.toggle('visible', window.scrollY > 500);
});

function toggleMenu(forceClose = false) {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('menuOverlay');
    if (!menu || !overlay) return;
    const open = forceClose ? false : !menu.classList.contains('active');
    menu.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterProducts(button) {
    const activeButton = button || document.querySelector('.filter-btn.active');
    const selected = activeButton?.textContent.trim().toLowerCase() || 'all';
    if (button) {
        document.querySelectorAll('.filter-btn').forEach(item => item.classList.toggle('active', item === button));
    }
    const query = document.getElementById('productSearch')?.value.trim().toLowerCase() || '';
    document.querySelectorAll('.product-card').forEach(card => {
        const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
        const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const matchesCategory = selected === 'all'
            || (selected === 'gold' && category.includes('gold'))
            || category.includes(selected);
        card.hidden = !matchesCategory || !`${name} ${category}`.includes(query);
    });
}

document.getElementById('productSearch')?.addEventListener('input', () => filterProducts());

async function subscribe(event) {
    event.preventDefault();
    const input = document.getElementById('subscriberEmail');
    const message = document.getElementById('subscribeMessage');
    if (!input || !message) return;

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: input.value.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Subscription failed.');
        message.textContent = data.message;
        message.style.color = '#D4AF37';
        input.value = '';
    } catch (error) {
        message.textContent = error.message || 'Unable to subscribe right now. Please try again later.';
        message.style.color = '#ff6b6b';
    }
}

document.getElementById('subscribeForm')?.addEventListener('submit', subscribe);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    anchor.addEventListener('click', event => {
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (target.id === 'productSearch') target.focus({ preventScroll: true });
        toggleMenu(true);
    });
});

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.product-card, .category-card, .feature-card, .testimonial-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}