// Hover/asset helpers when script.js not loaded (e.g. on fragrances page)
if (typeof window !== 'undefined' && typeof window.getHoverImagePaths !== 'function') {
    window.getHoverImagePaths = function(imagePath) {
        if (!imagePath || typeof imagePath !== 'string' || imagePath.indexOf('http') === 0) return [];
        if (imagePath.indexOf('images/bags/') === 0) {
            imagePath = imagePath.replace(/\/([^/]+)$/, function (_, name) {
                return '/' + name.replace(/%20/gi, '-').replace(/\s+/g, '-');
            });
        }
        var match = imagePath.match(/^(.+)-(\d+)(\-?\.[a-zA-Z0-9]+)$/);
        if (match) {
            var base = match[1], num = parseInt(match[2], 10), ext = match[3], out = [];
            out.push(base + '-' + (num + 1) + ext);
            out.push(base + '-' + (num + 2) + ext);
            return out;
        }
        var matchNum = imagePath.match(/^(.+\/)(\d+)(\.[a-zA-Z0-9]+)$/);
        if (matchNum) {
            var basePath = matchNum[1], n = parseInt(matchNum[2], 10), ext2 = matchNum[3], o = [];
            for (var j = n + 1; j <= n + 3; j++) o.push(basePath + j + ext2);
            return o;
        }
        var matchSpace = imagePath.match(/^(.+)\s+(\d+)(\.[a-zA-Z0-9]+)$/);
        if (matchSpace) {
            var b = matchSpace[1], n2 = parseInt(matchSpace[2], 10), ex = matchSpace[3], o2 = [];
            for (var k = n2 + 1; k <= n2 + 2; k++) o2.push(b + ' ' + k + ex);
            return o2;
        }
        return [];
    };
}
if (typeof window !== 'undefined' && typeof window.assetUrl !== 'function') {
    window.assetUrl = function(rel) { return rel || ''; };
}

// Product Data - Fragrances (hyphenated filenames for GitHub Pages)
const fragranceProducts = [
    { id: 401, name: "Beija Flor Elasti-Cream", description: "Nourishing body cream with a delicate, long-lasting fragrance. Leaves skin soft and subtly scented.", price: 2800, image: "images/fragrances/beija-flor-elasti-cream-1.jpg", category: "fragrance" },
    { id: 402, name: "Coco Cabana Cream", description: "Tropical coconut body cream. Rich texture with a summery scent that lingers all day.", price: 2600, image: "images/fragrances/coco-cabana-cream-1.jpg", category: "fragrance" },
    { id: 403, name: "Laneige Sleeping Mask", description: "Overnight lip and skin care with a light, fresh scent. Wake up to hydrated, glowing skin.", price: 3200, image: "images/fragrances/laneige-sleeping-mask-1-.jpg", category: "fragrance" },
    { id: 404, name: "Sol de Janeiro Bum Bum Jet Set", description: "Travel-size cult favourite. Creamy body fragrance with warm, addictive notes.", price: 3500, image: "images/fragrances/sol-de-janeiro-bum-bum-jet-set-1.jpg", category: "fragrance" },
    { id: 405, name: "Sol del Janeiro Scent", description: "Signature body mist and fragrance. Bold, sunny scent that turns heads.", price: 2900, image: "images/fragrances/sol-del-janeiro-scent-1.jpg", category: "fragrance" },
    { id: 406, name: "Sundays in Rio", description: "Relaxing, breezy fragrance inspired by lazy beach days. Light and uplifting.", price: 2700, image: "images/fragrances/Sundays-in-rio-1.jpg", category: "fragrance" }
];

if (typeof window !== 'undefined') {
    window.fragranceProducts = fragranceProducts;
}

if (typeof window.cart === 'undefined') {
    window.cart = [];
}

var fragranceBannerLeft = fragranceProducts.slice(0, 2).map(function(p) { return p.image; });
var fragranceBannerRight = fragranceProducts.slice(2, 4).map(function(p) { return p.image; });
const editorialBannersFragrances = [
    { headline: 'Shop', title: 'Fragrances', body: 'Body creams, mists and cult favourites. Find your signature scent.', ctaText: 'Shop Fragrances', ctaUrl: 'fragrances.html', leftImgs: fragranceBannerLeft, rightImgs: fragranceBannerRight }
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

function getFilteredFragranceProducts() {
    var checks = document.querySelectorAll('input[name="fragrancePrice"]:checked');
    if (!checks.length) return fragranceProducts;
    var ranges = Array.from(checks).map(function(c) { return c.value; });
    return fragranceProducts.filter(function(p) {
        var pr = p.price || 0;
        return ranges.some(function(r) {
            if (r === 'under2500') return pr < 2500;
            if (r === '2500-3500') return pr >= 2500 && pr < 3500;
            if (r === 'over3500') return pr >= 3500;
            return false;
        });
    });
}

function applyFragranceFilters() {
    var filtered = getFilteredFragranceProducts();
    renderProducts(filtered);
    var countEl = document.getElementById('fragranceItemCount');
    if (countEl) countEl.textContent = filtered.length;
    var countMobile = document.getElementById('fragranceItemCountMobile');
    if (countMobile) countMobile.textContent = filtered.length;
}

function initFragranceMobileFilter() {
    var filterBtn = document.getElementById('fragranceMobileFilterBtn');
    var backdrop = document.getElementById('fragranceFilterBackdrop');
    var closeBtn = document.getElementById('fragranceFilterClose');
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

document.addEventListener('DOMContentLoaded', function() {
    renderProducts(fragranceProducts);
    var countEl = document.getElementById('fragranceItemCount');
    if (countEl) countEl.textContent = fragranceProducts.length;
    var countMobile = document.getElementById('fragranceItemCountMobile');
    if (countMobile) countMobile.textContent = fragranceProducts.length;
    document.querySelectorAll('input[name="fragrancePrice"]').forEach(function(input) {
        input.addEventListener('change', applyFragranceFilters);
    });
    initFragranceMobileFilter();
    loadCartFromStorage();
    updateCartCount();
});

function renderProducts(filteredProducts) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    var list = filteredProducts || fragranceProducts;
    var bannerIndex = 0;
    list.forEach(function(product, i) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = function() { window.location.href = 'product-detail.html?id=' + product.id + '&category=fragrance'; };
        productCard.style.cursor = 'pointer';
        var hoverPaths = (typeof getHoverImagePaths === 'function' && getHoverImagePaths(product.image)) || [];
        var firstHoverSrc = hoverPaths[0] ? (typeof assetUrl === 'function' ? assetUrl(hoverPaths[0]) : hoverPaths[0]) : '';
        var hoverHtml = hoverPaths.map(function(hoverPath) { return '<img class="product-img-hover" src="' + (typeof assetUrl === 'function' ? assetUrl(hoverPath) : hoverPath) + '" alt="' + (product.name || '').replace(/"/g, '&quot;') + '" onerror="this.style.display=\'none\'">'; }).join('');
        var mainSrc = (typeof assetUrl === 'function' ? assetUrl(product.image) : product.image || '');
        var fallbackAttr = firstHoverSrc ? ' data-fallback-src="' + firstHoverSrc.replace(/"/g, '&quot;') + '"' : '';
        productCard.innerHTML = '<div class="product-image" style="background: linear-gradient(135deg, #fce4ec, #f3e5f5);"><img src="' + mainSrc + '" alt="' + (product.name || '').replace(/"/g, '&quot;') + '"' + fallbackAttr + ' onerror="if(this.dataset.fallbackSrc){this.onerror=null;this.src=this.dataset.fallbackSrc;}else{this.style.display=\'none\';}">' + hoverHtml + '</div><h3 class="product-name">' + (product.name || '') + '</h3><p class="product-description">' + (product.description || '') + '</p><div class="product-price">KSH ' + (product.price || 0).toLocaleString() + '</div><button type="button" class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(' + product.id + ');">Add to Cart</button>';
        productsGrid.appendChild(productCard);
        if ((i + 1) % 2 === 0 && i + 1 < list.length && editorialBannersFragrances.length > 0) {
            var config = editorialBannersFragrances[bannerIndex % editorialBannersFragrances.length];
            productsGrid.appendChild(createEditorialBanner(config));
            bannerIndex++;
        }
    });
    observeEditorialBanners();
}

function getSharedCart() {
    var savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) return JSON.parse(savedCart);
    return [];
}

function addToCartFragrances(productId) {
    var product = fragranceProducts.find(function(p) { return p.id === productId; });
    if (!product) return;
    var allCartItems = getSharedCart();
    var existingItem = allCartItems.find(function(item) { return item.id === productId && item.category === (product.category || 'fragrance'); });
    if (existingItem) {
        existingItem.quantity += 1;
        window.cart = allCartItems;
    } else {
        allCartItems.push({ id: product.id, name: product.name, description: product.description, price: product.price, image: product.image, quantity: 1, category: product.category || 'fragrance' });
        window.cart = allCartItems;
    }
    saveCartToStorage();
    updateCartCount();
    showNotification((product.name || 'Item') + ' added to cart! ✨');
    var cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay && cartOverlay.classList.contains('active')) {
        renderCart();
        if (typeof renderYouMayAlsoLike === 'function') renderYouMayAlsoLike('cartYouMayAlsoLike');
    }
}
window.addToCart = (typeof window.addToCartUnified === 'function') ? window.addToCartUnified : addToCartFragrances;

function removeFromCart(productId) {
    window.cart = window.cart.filter(function(item) { return item.id !== productId; });
    saveCartToStorage();
    updateCartCount();
    renderCart();
    showNotification('Item removed from cart');
}

function updateQuantity(productId, change) {
    var item = window.cart.find(function(i) { return i.id === productId; });
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) removeFromCart(productId);
    else { saveCartToStorage(); updateCartCount(); renderCart(); }
}

function saveCartToStorage() {
    try { localStorage.setItem('slayStationCart', JSON.stringify(window.cart || [])); } catch (e) {}
}
function loadCartFromStorage() {
    window.cart = getSharedCart();
}

function renderCart() {
    var cartItems = document.getElementById('cartItems');
    var cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;
    var allCartItems = getSharedCart();
    window.cart = allCartItems;
    if (window.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. Start shopping!</p>';
        cartTotal.textContent = '0';
        return;
    }
    cartItems.innerHTML = '';
    var total = 0;
    window.cart.forEach(function(item) {
        var imageHTML = item.image && item.image.indexOf('images/') !== -1
            ? '<img src="' + (typeof assetUrl === 'function' ? assetUrl(item.image) : item.image) + '" alt="' + (item.name || '') + '" onerror="this.onerror=null; this.parentElement.innerHTML=\'🌸\';">'
            : (item.image || '🌸');
        var div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = '<div class="cart-item-image">' + imageHTML + '</div><div class="cart-item-details"><div class="cart-item-name">' + (item.name || '') + '</div><div class="cart-item-price">KSH ' + (item.price || 0).toLocaleString() + '</div><div class="cart-item-quantity"><button class="quantity-btn" onclick="updateQuantity(' + item.id + ', -1)">−</button><span>Qty: ' + (item.quantity || 1) + '</span><button class="quantity-btn" onclick="updateQuantity(' + item.id + ', 1)">+</button><button class="remove-item" onclick="removeFromCart(' + item.id + ')" style="margin-left: auto;">Remove</button></div></div>';
        cartItems.appendChild(div);
        total += (item.price || 0) * (item.quantity || 1);
    });
    cartTotal.textContent = total.toLocaleString();
}

function updateCartCount() {
    var cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    var allCartItems = getSharedCart();
    var totalItems = (allCartItems || []).reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0);
    cartCount.textContent = totalItems;
    if (totalItems > 0) { cartCount.style.display = ''; cartCount.style.visibility = 'visible'; cartCount.removeAttribute('aria-hidden'); }
    else { cartCount.style.display = 'none'; cartCount.setAttribute('aria-hidden', 'true'); }
}

function showNotification(msg) {
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) { window.showNotification(msg); return; }
    var n = document.createElement('div');
    n.className = 'cart-notification';
    n.textContent = msg;
    n.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:0.9rem;';
    document.body.appendChild(n);
    setTimeout(function() { if (n.parentNode) n.parentNode.removeChild(n); }, 2500);
}

function toggleCart() {
    var cartOverlay = document.getElementById('cartOverlay');
    if (!cartOverlay) return;
    cartOverlay.classList.toggle('active');
    if (cartOverlay.classList.contains('active')) {
        loadCartFromStorage();
        renderCart();
        if (typeof renderYouMayAlsoLike === 'function') renderYouMayAlsoLike('cartYouMayAlsoLike');
    }
}

function checkout() {
    var items = typeof getSharedCart === 'function' ? getSharedCart() : (window.cart || []);
    if (!items || items.length === 0) { alert('Your cart is empty! Add some items first. 💕'); return; }
    if (typeof saveCartToStorage === 'function') saveCartToStorage();
    var path = typeof location !== 'undefined' && location.pathname ? location.pathname : '/';
    var dir = path.replace(/\/[^/]*$/, '') || '/';
    if (!dir.endsWith('/')) dir += '/';
    var base = (typeof location !== 'undefined' && location.origin ? location.origin : '') + dir;
    window.location.href = base + 'checkout.html';
}

function renderYouMayAlsoLike(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var productList = fragranceProducts || [];
    var cartIds = (window.cart || []).map(function(item) { return item.id; });
    var exclude = {};
    cartIds.forEach(function(id) { exclude[id] = true; });
    var available = productList.filter(function(p) { return p.id && !exclude[p.id]; });
    var shuffled = available.slice().sort(function() { return 0.5 - Math.random(); });
    var toShow = shuffled.slice(0, 8);
    if (toShow.length === 0) { container.innerHTML = '<p class="empty-cart" style="padding:1rem 0;color:#6b6b6b;font-size:0.85rem;">No recommendations right now.</p>'; return; }
    container.innerHTML = toShow.map(function(p) {
        var img = (typeof assetUrl === 'function' ? assetUrl(p.image) : p.image) || '';
        return '<a href="product-detail.html?id=' + p.id + '&category=fragrance" class="ymal-card"><div class="ymal-card-img"><img src="' + img + '" alt="" onerror="this.style.display=\'none\'"></div><div class="ymal-card-name">' + (p.name || '') + '</div><div class="ymal-card-price">KSH ' + (p.price || 0).toLocaleString() + '</div></a>';
    }).join('');
}
