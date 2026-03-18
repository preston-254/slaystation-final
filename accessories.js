// Product Data - Accessories (Belts and MP3 Players)
const accessoryProducts = [
    {
        id: 201,
        name: "Classic Leather Belt",
        description: "Timeless leather belt with elegant buckle design. Perfect for any outfit!",
        price: 1200,
        image: "images/belt/img-20251123-wa0050.jpg",
        category: "belt"
    },
    {
        id: 202,
        name: "Stylish Designer Belt",
        description: "Fashionable belt with modern design and premium quality.",
        price: 1200,
        image: "images/belt/img-20251123-wa0054.jpg",
        category: "belt"
    },
    {
        id: 203,
        name: "Elegant Fashion Belt",
        description: "Sophisticated belt that adds the perfect finishing touch to your look.",
        price: 1200,
        image: "images/belt/img-20251123-wa0063.jpg",
        category: "belt"
    },
    {
        id: 204,
        name: "Portable MP3 Player",
        description: "Compact MP3 player with excellent sound quality. Perfect for music lovers on the go!",
        price: 2500,
        image: "images/mp3-player/img-20251123-wa0035.jpg",
        category: "mp3-player"
    },
    {
        id: 205,
        name: "Wireless MP3 Player",
        description: "Modern wireless MP3 player with Bluetooth connectivity and sleek design.",
        price: 2800,
        image: "images/mp3-player/img-20251123-wa0036.jpg",
        category: "mp3-player"
    },
    {
        id: 206,
        name: "Premium MP3 Player",
        description: "High-quality MP3 player with advanced features and long battery life.",
        price: 3000,
        image: "images/mp3-player/img-20251123-wa0048.jpg",
        category: "mp3-player"
    }
];

// Cart Management (shared across all pages) – use window.cart only to avoid duplicate declaration with script.js
if (typeof window.cart === 'undefined') {
    window.cart = [];
}

// Taupe editorial banners – Valentine image as background
const VALENTINE_EDITORIAL_BG = 'images/valentine-editorial-bg.png';
const editorialBannersAccessories = [
    { headline: 'Happy', title: "Valentine's Day Sale", body: 'Discover the look, feel and quality of Slay Station.', ctaText: 'Read More', ctaUrl: 'index.html#products', useVideo: true, backgroundImageUrl: VALENTINE_EDITORIAL_BG },
    { headline: 'Discover', title: 'Bag Accessories', body: 'Belts, MP3 players and more to complete your look.', ctaText: 'View Accessories', ctaUrl: 'accessories.html', useVideo: true, backgroundImageUrl: VALENTINE_EDITORIAL_BG }
];
function createEditorialBanner(config) {
    const section = document.createElement('section');
    section.className = 'editorial-banner editorial-banner--video';
    section.setAttribute('aria-label', config.title);
    var bg = config.backgroundImageUrl || '';
    var wrapStyle = bg ? ' style="background-image: url(\'' + bg + '\'); background-size: cover; background-position: center;"' : '';
    section.innerHTML = '<div class="editorial-banner-video-wrap editorial-banner-bg-image"' + wrapStyle + '><div class="editorial-banner-video-overlay"></div></div><div class="editorial-banner-inner editorial-banner-inner--center"><div class="editorial-banner-content"><p class="editorial-banner-headline">' + config.headline + '</p><h2 class="editorial-banner-title">' + config.title + '</h2><p class="editorial-banner-body">' + config.body + '</p><a href="' + config.ctaUrl + '" class="editorial-banner-cta">' + config.ctaText + '</a></div></div>';
    return section;
}
function observeEditorialBanners() {
    var banners = document.querySelectorAll('.editorial-banner');
    if (!banners.length) return;
    var observer = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('editorial-banner-visible'); }); }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
    banners.forEach(function(b) { observer.observe(b); });
}

// Apply accessory filters (type, price in KSH) – apply immediately when checkbox changes
function getFilteredAccessoryProducts() {
    var typeChecks = document.querySelectorAll('input[name="accessoryType"]:checked');
    var priceChecks = document.querySelectorAll('input[name="accessoryPrice"]:checked');
    var list = accessoryProducts;
    if (typeChecks.length) {
        var types = Array.from(typeChecks).map(function(c) { return c.value; });
        list = list.filter(function(p) {
            if (types.indexOf('belt') !== -1 && p.category === 'belt') return true;
            if (types.indexOf('mp3-player') !== -1 && p.category === 'mp3-player') return true;
            return false;
        });
    }
    if (priceChecks.length) {
        var ranges = Array.from(priceChecks).map(function(c) { return c.value; });
        list = list.filter(function(p) {
            var pr = p.price || 0;
            return ranges.some(function(r) {
                if (r === 'under1500') return pr < 1500;
                if (r === '1500-2500') return pr >= 1500 && pr < 2500;
                if (r === '2500-3500') return pr >= 2500 && pr < 3500;
                if (r === 'over3500') return pr >= 3500;
                return false;
            });
        });
    }
    return list;
}

function applyAccessoryFilters() {
    var filtered = getFilteredAccessoryProducts();
    renderProducts(filtered);
    var countEl = document.getElementById('accessoryItemCount');
    if (countEl) countEl.textContent = filtered.length;
    var countMobile = document.getElementById('accessoryItemCountMobile');
    if (countMobile) countMobile.textContent = filtered.length;
}

function initAccessoryMobileFilter() {
    var filterBtn = document.getElementById('accessoryMobileFilterBtn');
    var backdrop = document.getElementById('accessoryFilterBackdrop');
    var closeBtn = document.getElementById('accessoryFilterClose');
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
    renderProducts(accessoryProducts);
    var countEl = document.getElementById('accessoryItemCount');
    if (countEl) countEl.textContent = accessoryProducts.length;
    var countMobile = document.getElementById('accessoryItemCountMobile');
    if (countMobile) countMobile.textContent = accessoryProducts.length;
    document.querySelectorAll('input[name="accessoryType"], input[name="accessoryPrice"]').forEach(function(input) {
        input.addEventListener('change', applyAccessoryFilters);
    });
    initAccessoryMobileFilter();
    loadCartFromStorage();
    updateCartCount();
});

// Render Products (optional filtered array)
function renderProducts(filteredProducts) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    var list = filteredProducts || accessoryProducts;
    var bannerIndex = 0;
    list.forEach(function(product, i) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = function() { window.location.href = 'product-detail.html?id=' + product.id + '&category=accessory'; };
        productCard.style.cursor = 'pointer';
        productCard.innerHTML = `
            <div class="product-image" style="background: linear-gradient(135deg, var(--secondary-pink), var(--lavender));">
                <img src="${(typeof assetUrl==='function'?assetUrl:function(p){return p||'';})(product.image)}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='🎀';">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">KSH ${product.price.toLocaleString()}</div>
        `;
        productsGrid.appendChild(productCard);
        if ((i + 1) % 2 === 0 && i + 1 < list.length && editorialBannersAccessories.length > 0) {
            var config = editorialBannersAccessories[bannerIndex % editorialBannersAccessories.length];
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
function addToCartAccessories(productId) {
    const product = accessoryProducts.find(p => p.id === productId);
    if (!product) return;
    const allCartItems = getSharedCart();
    const existingItem = allCartItems.find(item => item.id === productId && item.category === product.category);
    if (existingItem) {
        existingItem.quantity += 1;
        window.cart = allCartItems;
    } else {
        allCartItems.push({ ...product, quantity: 1, category: product.category || 'accessory' });
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
window.addToCart = (typeof window.addToCartUnified === 'function') ? window.addToCartUnified : addToCartAccessories;

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
            ? `<img src="${(typeof assetUrl==='function'?assetUrl:function(p){return p||'';})(item.image)}" alt="${item.name}" onerror="this.onerror=null; this.parentElement.innerHTML='🎀';">`
            : item.image || '🎀';
        
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
    if (!cartCount) return; // Not on a page with cart badge (e.g. admin)
    // Get total from shared cart to include items from all pages
    const allCartItems = getSharedCart();
    const totalItems = (allCartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = totalItems;
}

// Toggle Cart
function toggleCart() {
    const cartOverlay = document.getElementById('cartOverlay');
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
    const productList = typeof accessoryProducts !== 'undefined' ? accessoryProducts : (window.accessoryProducts || []);
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
        const href = 'product-detail.html?id=' + (p.id || '') + '&category=accessory';
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

// Checkout
function checkout() {
    if (!window.cart || window.cart.length === 0) {
        alert('Your cart is empty! Add some items first. 💕');
        return;
    }

    const orderModal = document.getElementById('orderModal');
    const orderSummary = document.getElementById('orderSummary');
    
    // Render order summary
    let summaryHTML = '';
    let total = 0;
    
    window.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        summaryHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${item.name} x${item.quantity}</span>
                <span>KSH ${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    summaryHTML += `
        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid white; font-weight: bold; font-size: 1.2rem;">
            <span>Total</span>
            <span>KSH ${total.toLocaleString()}</span>
        </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
    
    // Close cart and open order modal
    document.getElementById('cartOverlay').classList.remove('active');
    orderModal.classList.add('active');
    if (typeof renderYouMayAlsoLike === 'function') renderYouMayAlsoLike('checkoutYouMayAlsoLike');
}

// Close Order Modal
function closeOrderModal() {
    var modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
}

// Handle Order Form Submission (only on pages that have orderForm)
var orderFormElAcc = document.getElementById('orderForm');
if (orderFormElAcc) {
    orderFormElAcc.addEventListener('submit', function(e) {
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
if (!document.getElementById('accessory-notification-styles')) {
    const accessoryStyle = document.createElement('style');
    accessoryStyle.id = 'accessory-notification-styles';
    accessoryStyle.textContent = `
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
    document.head.appendChild(accessoryStyle);
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
