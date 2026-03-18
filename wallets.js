// Product Data - Wallets (from images/wallet folder; hyphenated filenames for GitHub Pages)
const walletProducts = [
    { id: 101, name: "Coach Khaki Wallet", description: "Classic Coach wallet in khaki. Timeless design with multiple card slots.", price: 1500, image: "images/wallet/coach-khaki-wallet.jpg", category: "wallet" },
    { id: 102, name: "Coach Wallet Blue", description: "Elegant blue Coach wallet. Premium finish and compact style.", price: 1500, image: "images/wallet/coach-wallet-blue.jpg", category: "wallet" },
    { id: 103, name: "Coach Wallet Purple", description: "Sophisticated purple Coach wallet for everyday use.", price: 1500, image: "images/wallet/coach-wallet-purple-.jpg", category: "wallet" },
    { id: 104, name: "Designer Wallet", description: "Refined designer wallet with quality leather and multiple compartments.", price: 1500, image: "images/wallet/DSC09519.jpg", category: "wallet" },
    { id: 105, name: "Victoria's Secret Wallet", description: "Victoria's Secret style wallet. Compact and stylish.", price: 1500, image: "images/wallet/victorias-secret-1.jpg", category: "wallet" },
    { id: 106, name: "Victoria's Secret Wallet 2", description: "Second style Victoria's Secret wallet. Premium and practical.", price: 1500, image: "images/wallet/victorias-secret-2.jpg", category: "wallet" }
];

// Export walletProducts to window for global access
if (typeof window !== 'undefined') {
    window.walletProducts = walletProducts;
}

// Cart Management (shared across all pages) – use window.cart only to avoid duplicate declaration with script.js
if (typeof window.cart === 'undefined') {
    window.cart = [];
}

// Taupe editorial banners – wallet product images in animated layout
var walletBannerLeft = walletProducts.slice(0, 2).map(function(p) { return p.image; });
var walletBannerRight = walletProducts.slice(2, 4).map(function(p) { return p.image; });
const editorialBannersWallets = [
    { headline: 'Shop', title: 'Premium Wallets', body: 'Refined leather and compact styles for every occasion. Quality and style that last.', ctaText: 'Shop Wallets', ctaUrl: 'wallets.html', leftImgs: walletBannerLeft, rightImgs: walletBannerRight }
];
function createEditorialBanner(config) {
    const section = document.createElement('section');
    section.className = 'editorial-banner editorial-banner--animated-imagery';
    section.setAttribute('aria-label', config.title);
    var leftHtml = (config.leftImgs || []).map(function(src, i) { return '<img src="' + src + '" alt="" loading="lazy" class="editorial-banner-img-animate" style="animation-delay: ' + (i * 0.15) + 's">'; }).join('');
    var rightHtml = (config.rightImgs || []).map(function(src, i) { return '<img src="' + src + '" alt="" loading="lazy" class="editorial-banner-img-animate" style="animation-delay: ' + (i * 0.15 + 0.2) + 's">'; }).join('');
    section.innerHTML = '<div class="editorial-banner-inner"><div class="editorial-banner-imagery editorial-banner-imagery-left">' + leftHtml + '</div><div class="editorial-banner-content"><p class="editorial-banner-headline">' + config.headline + '</p><h2 class="editorial-banner-title">' + config.title + '</h2><p class="editorial-banner-body">' + config.body + '</p><a href="' + config.ctaUrl + '" class="editorial-banner-cta">' + config.ctaText + '</a></div><div class="editorial-banner-imagery editorial-banner-imagery-right">' + rightHtml + '</div></div>';
    return section;
}
function observeEditorialBanners() {
    var banners = document.querySelectorAll('.editorial-banner');
    if (!banners.length) return;
    var observer = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('editorial-banner-visible'); }); }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
    banners.forEach(function(b) { observer.observe(b); });
}

// Apply wallet filters (price in KSH) – apply immediately when checkbox changes
function getFilteredWalletProducts() {
    var checks = document.querySelectorAll('input[name="walletPrice"]:checked');
    if (!checks.length) return walletProducts;
    var ranges = Array.from(checks).map(function(c) { return c.value; });
    return walletProducts.filter(function(p) {
        var pr = p.price || 0;
        return ranges.some(function(r) {
            if (r === 'under1000') return pr < 1000;
            if (r === '1000-2000') return pr >= 1000 && pr < 2000;
            if (r === 'over2000') return pr >= 2000;
            return false;
        });
    });
}

function applyWalletFilters() {
    var filtered = getFilteredWalletProducts();
    renderProducts(filtered);
    var countEl = document.getElementById('walletItemCount');
    if (countEl) countEl.textContent = filtered.length;
    var countMobile = document.getElementById('walletItemCountMobile');
    if (countMobile) countMobile.textContent = filtered.length;
}

function initWalletMobileFilter() {
    var filterBtn = document.getElementById('walletMobileFilterBtn');
    var backdrop = document.getElementById('walletFilterBackdrop');
    var closeBtn = document.getElementById('walletFilterClose');
    function closeFilter() {
        document.body.classList.remove('page-filter-open');
        if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
    }
    if (filterBtn) filterBtn.addEventListener('click', function() {
        document.body.classList.add('page-filter-open');
        if (backdrop) backdrop.setAttribute('aria-hidden', 'false');
    });
    if (backdrop) backdrop.addEventListener('click', closeFilter);
    if (closeBtn) closeBtn.addEventListener('click', closeFilter);
}

// Load products on page load (skip on admin page – no cart/filters DOM)
document.addEventListener('DOMContentLoaded', function() {
    var isAdminPage = typeof window !== 'undefined' && window.location && (/(^|\/)admin\.html$/i.test((window.location.pathname || '') + (window.location.href || '')));
    if (isAdminPage) return;
    renderProducts(walletProducts);
    var countEl = document.getElementById('walletItemCount');
    if (countEl) countEl.textContent = walletProducts.length;
    var countMobile = document.getElementById('walletItemCountMobile');
    if (countMobile) countMobile.textContent = walletProducts.length;
    document.querySelectorAll('input[name="walletPrice"]').forEach(function(input) {
        input.addEventListener('change', applyWalletFilters);
    });
    initWalletMobileFilter();
    loadCartFromStorage();
    updateCartCount();
});

// Render Products (optional filtered array)
function renderProducts(filteredProducts) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    var list = filteredProducts || walletProducts;
    var bannerIndex = 0;
    list.forEach(function(product, i) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card product-card--no-hover';
        productCard.onclick = function() { window.location.href = 'product-detail.html?id=' + product.id + '&category=wallet'; };
        productCard.style.cursor = 'pointer';
        productCard.innerHTML = `
            <div class="product-image" style="background: linear-gradient(135deg, var(--secondary-pink), var(--lavender));">
                <img src="${(typeof assetUrl==='function'?assetUrl:function(p){return p||'';})(product.image)}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='👛';">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">KSH ${product.price.toLocaleString()}</div>
            <button type="button" class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id});">Add to Cart</button>
        `;
        productsGrid.appendChild(productCard);
        if ((i + 1) % 2 === 0 && i + 1 < list.length && editorialBannersWallets.length > 0) {
            var config = editorialBannersWallets[bannerIndex % editorialBannersWallets.length];
            productsGrid.appendChild(createEditorialBanner(config));
            bannerIndex++;
        }
    });
    observeEditorialBanners();
}

// Get shared cart from localStorage
function getSharedCart() {
    const savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) {
        return JSON.parse(savedCart);
    }
    return [];
}

// Add to Cart – use unified (script.js) when available so product-detail works for all categories
function addToCartWallets(productId) {
    const product = walletProducts.find(p => p.id === productId);
    if (!product) return;

    const allCartItems = getSharedCart();
    const existingItem = allCartItems.find(item => item.id === productId && item.category === product.category);
    
    if (existingItem) {
        existingItem.quantity += 1;
        window.cart = allCartItems;
    } else {
        const itemToAdd = { ...product, quantity: 1, category: product.category || 'wallet' };
        allCartItems.push(itemToAdd);
        window.cart = allCartItems;
    }
    saveCartToStorage();
    updateCartCount();
    showNotification(`${product.name} added to cart! ✨`);
    var cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay && cartOverlay.classList.contains('active')) {
        renderCart();
        if (typeof renderYouMayAlsoLike === 'function') renderYouMayAlsoLike('cartYouMayAlsoLike');
    }
}
window.addToCart = (typeof window.addToCartUnified === 'function') ? window.addToCartUnified : addToCartWallets;

// Remove from Cart
function removeFromCart(productId) {
    window.cart = window.cart.filter(item => !(item.id === productId));
    saveCartToStorage();
    updateCartCount();
    renderCart();
    showNotification('Item removed from cart');
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = window.cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCartToStorage();
        updateCartCount();
        renderCart();
    }
}

// Render Cart (shows all items from all pages)
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Load all items from shared cart
    const allCartItems = getSharedCart();
    window.cart = allCartItems;
    
    if (window.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. Start shopping!</p>';
        cartTotal.textContent = '0';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    window.cart.forEach(item => {
        const imageHTML = item.image && item.image.includes('images/') 
            ? `<img src="${(typeof assetUrl==='function'?assetUrl:function(p){return p||'';})(item.image)}" alt="${item.name}" onerror="this.onerror=null; this.parentElement.innerHTML='👜';">`
            : item.image || '👜';
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">${imageHTML}</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">KSH ${item.price.toLocaleString()}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span>Qty: ${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})" style="margin-left: auto;">Remove</button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toLocaleString();
}

// Update Cart Count (shows count from all pages)
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    const allCartItems = getSharedCart();
    const totalItems = (allCartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = totalItems;
    if (totalItems > 0) {
        cartCount.style.display = '';
        cartCount.style.visibility = 'visible';
        cartCount.removeAttribute('aria-hidden');
    } else {
        cartCount.style.display = 'none';
        cartCount.setAttribute('aria-hidden', 'true');
    }
}

// Toggle Cart
function toggleCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    if (!cartOverlay) return;
    cartOverlay.classList.toggle('active');
    
    if (cartOverlay.classList.contains('active')) {
        loadCartFromStorage();
        renderCart();
        if (typeof renderYouMayAlsoLike === 'function') renderYouMayAlsoLike('cartYouMayAlsoLike');
        var section = document.getElementById('cartYouMayAlsoLikeSection') || document.querySelector('.you-may-also-like--cart');
        if (section) {
            try {
                if (sessionStorage.getItem('cartYmalDismissed') === 'true') section.classList.add('is-dismissed');
                else section.classList.remove('is-dismissed');
            } catch (e) {}
        }
    }
}

// You May Also Like – render carousel (Fashionphile-style)
function renderYouMayAlsoLike(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const productList = typeof walletProducts !== 'undefined' ? walletProducts : (window.walletProducts || []);
    const cartIds = (window.cart || []).map(function (item) { return item.id; });
    const exclude = new Set(cartIds);
    const available = productList.filter(function (p) { return p.id && !exclude.has(p.id); });
    const shuffled = available.slice().sort(function () { return 0.5 - Math.random(); });
    const toShow = shuffled.slice(0, 8);
    if (toShow.length === 0) {
        container.innerHTML = '<p class="empty-cart" style="padding:1rem 0;color:#6b6b6b;font-size:0.85rem;">No recommendations right now.</p>';
        return;
    }
    const wishlistCounts = [22, 56, 39, 40, 237, 19, 17, 24];
    var openInNewTab = containerId === 'checkoutYouMayAlsoLike';
    var linkAttrs = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    var isCartYmal = containerId === 'cartYouMayAlsoLike';
    container.innerHTML = toShow.map(function (p, i) {
        const price = typeof p.price === 'number' ? p.price : parseInt(p.price, 10) || 0;
        const count = wishlistCounts[i % wishlistCounts.length];
        const href = 'product-detail.html?id=' + (p.id || '') + '&category=wallet';
        const img = (p.image || '').indexOf('http') === 0 ? p.image : (p.image || 'images/bags/img_1328.jpg');
        const name = (p.name || 'Product').substring(0, 45);
        const escName = name.replace(/"/g, '&quot;');
        if (isCartYmal) {
            return '<div class="ymal-card ymal-card--cart">' +
                '<a href="' + href + '" class="ymal-card-link">' +
                '<div class="ymal-card-image-wrap">' +
                '<img src="' + img + '" alt="' + escName + '" loading="lazy">' +
                '<span class="ymal-card-wishlist" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                count + '</span></div>' +
                '<span class="ymal-card-brand">Slay Station</span>' +
                '<span class="ymal-card-name">' + name + '</span>' +
                '<span class="ymal-card-condition">Condition: New</span>' +
                '<span class="ymal-card-price">KSH ' + price.toLocaleString() + '</span></a>' +
                '<button type="button" class="ymal-card-add-btn" onclick="event.stopPropagation(); addToCart(' + p.id + ');">Add to Cart</button></div>';
        }
        return '<a href="' + href + '" class="ymal-card"' + linkAttrs + '>' +
            '<div class="ymal-card-image-wrap">' +
            '<img src="' + img + '" alt="' + escName + '" loading="lazy">' +
            '<span class="ymal-card-wishlist" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
            count + '</span></div>' +
            '<span class="ymal-card-brand">Slay Station</span>' +
            '<span class="ymal-card-name">' + name + '</span>' +
            '<span class="ymal-card-condition">Condition: New</span>' +
            '<span class="ymal-card-price">KSH ' + price.toLocaleString() + '</span></a>';
    }).join('');
}

function dismissCartRecommendations() {
    var section = document.getElementById('cartYouMayAlsoLikeSection') || document.querySelector('.you-may-also-like--cart');
    if (section) {
        section.classList.add('is-dismissed');
        try { sessionStorage.setItem('cartYmalDismissed', 'true'); } catch (e) {}
    }
}

function scrollYouMayAlsoLike(containerId, direction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const step = 160;
    container.scrollBy({ left: direction * step, behavior: 'smooth' });
}

// Checkout – same as bags: go to full-page checkout.html
function checkout() {
    var items = typeof getSharedCart === 'function' ? getSharedCart() : (window.cart || []);
    if (!items || items.length === 0) {
        alert('Your cart is empty! Add some items first. 💕');
        return;
    }
    if (typeof saveCartToStorage === 'function') saveCartToStorage();
    var path = typeof location !== 'undefined' && location.pathname ? location.pathname : '/';
    var dir = path.replace(/\/[^/]*$/, '') || '/';
    if (!dir.endsWith('/')) dir += '/';
    var base = (typeof location !== 'undefined' && location.origin ? location.origin : '') + dir;
    window.location.href = base + 'checkout.html';
}

// Close Order Modal
function closeOrderModal() {
    var modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
}

// Handle Order Form Submission (only on pages that have orderForm)
var orderFormEl = document.getElementById('orderForm');
if (orderFormEl) {
    orderFormEl.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subtotal = (window.cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;
    
    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        payment: formData.get('payment'),
        items: (window.cart || []).map(item => ({...item})),
        subtotal: subtotal,
        total: total
    };
    
    // Check if user is logged in
    let userId = null;
    if (typeof window.getCurrentUser === 'function') {
        const user = window.getCurrentUser();
        if (user) {
            userId = user.id;
            orderData.userId = userId;
        }
    }
    
    // Create order using admin.js function
    let order;
    if (typeof window.createOrder === 'function') {
        order = window.createOrder(orderData);
    } else {
        // Fallback if admin.js not loaded
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        order = {
            id: orderId,
            date: new Date().toISOString(),
            ...orderData,
            status: 'pending',
            deliveryFee: null,
            deliveryFeePaid: false,
            deliveryFeeSet: false,
            deliveryFeeNotificationSent: false,
            mpesaCode: null,
            notifications: []
        };
        orders.push(order);
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
    }
    
    console.log('Order placed:', order);
    
    // Show success message
    alert(`🎉 Order Placed Successfully! 🎉\n\nThank you ${orderData.name}! Your order has been received.\n\nOrder #${order.id}\n\nSubtotal: KSH ${subtotal.toLocaleString()}\nTotal: KSH ${total.toLocaleString()}\n\n📦 Your order is being processed. The admin will set your delivery fee and notify you.\n\nYou can track your order using Order #${order.id}!\n\nWe'll contact you soon! 💕`);
    
    // Clear cart completely
    window.cart = [];
    localStorage.setItem('slayStationCart', JSON.stringify([]));
    updateCartCount();
    
    // Update cart display if it's open
    if (document.getElementById('cartOverlay') && document.getElementById('cartOverlay').classList.contains('active')) {
        renderCart();
    }
    
    // Close modal and reset form
    closeOrderModal();
    e.target.reset();
    });
}

// Save Cart to Local Storage
function saveCartToStorage() {
    localStorage.setItem('slayStationCart', JSON.stringify(window.cart || []));
}

// Load Cart from Local Storage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) {
        const parsed = JSON.parse(savedCart);
        window.cart.length = 0;
        window.cart.push(...parsed);
        updateCartCount();
    }
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-pink), var(--purple));
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(255, 107, 157, 0.4);
        z-index: 4000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
// Only create style element if it doesn't already exist (to avoid conflicts when multiple scripts are loaded)
if (!document.getElementById('wallet-notification-styles')) {
    const walletStyle = document.createElement('style');
    walletStyle.id = 'wallet-notification-styles';
    walletStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
    document.head.appendChild(walletStyle);
}

// Close cart when clicking outside
var cartOverlayEl = document.getElementById('cartOverlay');
if (cartOverlayEl) cartOverlayEl.addEventListener('click', function(e) {
    if (e.target === this) {
        toggleCart();
    }
});

// Close modal when clicking outside
var orderModalEl = document.getElementById('orderModal');
if (orderModalEl) orderModalEl.addEventListener('click', function(e) {
    if (e.target === this) {
        closeOrderModal();
    }
});
