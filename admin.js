// Admin Dashboard Script – Login with Google (2-Step Verification required on Google account)
let orders = [];
let filteredOrders = []; // Initialize filtered orders array
const ADMIN_EMAILS = [
    'preston.mwendwa@riarauniversity.ac.ke',
    'isabellewambui@gmail.com'
]; // Only these Google account emails can access admin
const isAdminEmail = (email) => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
};

// Show admin dashboard (called after successful Google sign-in or on auth state restore)
function showAdminDashboard(email) {
    var loginSection = document.getElementById('loginSection');
    var adminDashboard = document.getElementById('adminDashboard');
    var loginWrap = document.querySelector('.login-page-wrap');
    if (loginSection) loginSection.style.display = 'none';
    if (loginWrap) loginWrap.style.display = 'none';
    if (adminDashboard) {
        adminDashboard.style.display = 'block';
        adminDashboard.style.visibility = 'visible';
    }
    if (document.body) document.body.classList.remove('login-page-active');
    try {
        localStorage.setItem('slayStationAdminLoggedIn', 'true');
        if (email) localStorage.setItem('slayStationAdminEmail', email);
    } catch (e) {}
    loadOrders();
}

// Sign in with Google (redirect flow – avoids popup blocker). Only ADMIN_EMAILS can access.
function adminGoogleSignIn() {
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('adminGoogleSignInBtn');
    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg || 'Sign-in failed.';
            errorEl.style.display = 'block';
        }
        if (btn) btn.disabled = false;
    }
    // Google sign-in only works over http/https – not when opening the file directly (file://)
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        showError('Open this page over http: run "firebase serve" or "npx serve deploy" from the project folder, then go to http://localhost:5000/admin.html (or the port shown).');
        return;
    }
    // If we're in an iframe (e.g. preview), open admin in top window so redirect works and isn't treated as popup
    try {
        if (typeof window !== 'undefined' && window.self !== window.top) {
            window.top.location.href = window.location.href;
            return;
        }
    } catch (e) {}
    var fb = typeof window !== 'undefined' && window.SlayStationFirebase;
    if (!fb || !fb.auth) {
        showError('Firebase Auth is not loaded. Please refresh the page.');
        return;
    }
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
        showError('Google Sign-In is not available. Please refresh the page.');
        return;
    }
    if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
    if (btn) btn.disabled = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    // Prefer popup so we stay on the page and get the result directly (no redirect issues)
    fb.auth.signInWithPopup(provider).then(function (result) {
        var user = result && result.user;
        if (btn) btn.disabled = false;
        if (user && user.email) {
            var email = user.email.toLowerCase().trim();
            if (!isAdminEmail(email)) {
                fb.auth.signOut();
                showError('Signed in as ' + email + '. This account is not in the admin list. Only preston.mwendwa@riarauniversity.ac.ke and isabellewambui@gmail.com can access.');
            } else {
                showAdminDashboard(email);
            }
        }
    }).catch(function (err) {
        if (btn) btn.disabled = false;
        var code = err && err.code;
        var msg = (err && err.message) ? err.message : 'Sign-in failed. Try again.';
        if (code === 'auth/popup-blocked') {
            msg = 'Popup was blocked. Please allow popups for this site and try again, or we will redirect you to Google.';
            try {
                fb.auth.signInWithRedirect(provider);
                msg = 'Redirecting to Google… If nothing happens, allow popups for this site and click Sign in again.';
            } catch (e) {}
        } else if (code === 'auth/operation-not-supported-in-this-environment') {
            msg = 'Open this page over http: run "npx serve deploy" then open http://localhost:3000/admin.html';
        }
        showError(msg);
    });
}

// Handle return from Google redirect and auth state (redirect avoids popup blocker)
function initAdminAuthState() {
    var fb = typeof window !== 'undefined' && window.SlayStationFirebase;
    if (!fb || !fb.auth) return;
    var errorEl = document.getElementById('loginError');
    var btn = document.getElementById('adminGoogleSignInBtn');
    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg || 'Sign-in failed.';
            errorEl.style.display = 'block';
        }
        if (btn) btn.disabled = false;
    }
    function applyAuthState(user) {
        if (user && user.email && isAdminEmail(user.email.toLowerCase().trim())) {
            showAdminDashboard(user.email);
        } else {
            try {
                localStorage.removeItem('slayStationAdminLoggedIn');
                localStorage.removeItem('slayStationAdminEmail');
            } catch (e) {}
            var loginSection = document.getElementById('loginSection');
            var adminDashboard = document.getElementById('adminDashboard');
            var loginWrap = document.querySelector('.login-page-wrap');
            if (loginSection) loginSection.style.display = 'block';
            if (loginWrap) loginWrap.style.display = '';
            if (adminDashboard) adminDashboard.style.display = 'none';
            if (document.body) document.body.classList.add('login-page-active');
        }
    }
    // Listen for auth state immediately – when returning from Google redirect, Firebase may set user and fire this before getRedirectResult resolves
    fb.auth.onAuthStateChanged(function (user) {
        if (user && user.email && isAdminEmail(user.email.toLowerCase().trim())) {
            showAdminDashboard(user.email);
        } else {
            applyAuthState(user);
        }
    });
    // Consume redirect result (required after signInWithRedirect); also handles errors and non-admin emails
    fb.auth.getRedirectResult().then(function (result) {
        var user = result && result.user;
        if (result && result.error) {
            showError((result.error && result.error.message) ? result.error.message : 'Sign-in failed.');
        } else if (user && user.email) {
            var email = user.email.toLowerCase().trim();
            if (!isAdminEmail(email)) {
                fb.auth.signOut();
                showError('Signed in as ' + email + '. This account is not in the admin list. Only preston.mwendwa@riarauniversity.ac.ke and isabellewambui@gmail.com can access.');
            } else {
                showAdminDashboard(email);
            }
        } else {
            var currentUser = fb.auth.currentUser;
            if (currentUser && currentUser.email && isAdminEmail(currentUser.email.toLowerCase().trim())) {
                showAdminDashboard(currentUser.email);
            }
        }
    }).catch(function (err) {
        if (btn) btn.disabled = false;
        showError((err && err.message) ? err.message : 'Sign-in failed. Try again.');
    });
}

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes (legacy)

function getStoredAdminPassword() {
    try {
        const over = localStorage.getItem('slayStationAdminPasswordOverride');
        return (over && over.length > 0) ? over : '';
    } catch (e) { return ''; }
}

function generateLoginCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function storeLoginCode(email, code, prefix) {
    prefix = prefix || 'adminLogin';
    const key = prefix + '_' + (email || '').toLowerCase().trim();
    const payload = { code: code, expires: Date.now() + CODE_EXPIRY_MS };
    try {
        sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {}
}

function getStoredLoginCode(email, prefix) {
    prefix = prefix || 'adminLogin';
    const key = prefix + '_' + (email || '').toLowerCase().trim();
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        if (payload.expires < Date.now()) {
            sessionStorage.removeItem(key);
            return null;
        }
        return payload.code;
    } catch (e) { return null; }
}

// Send code to email. Uses Firebase callable when available (real email); else window.sendAdminCodeToEmail or on-screen banner.
function sendCodeToEmail(email, code, purpose) {
    var api = typeof window !== 'undefined' && window.SlayStationAdminFirebase;
    if (api && api.available && typeof api.sendAdminCode === 'function') {
        api.sendAdminCode(email, code, purpose || 'login').then(function (data) {
            if (data && data.ok) {
                showCodeBanner(email, code, true);
            } else {
                showCodeBanner(email, code, false);
            }
        }).catch(function (err) {
            console.warn('Send admin code failed:', err);
            showCodeBanner(email, code, false);
        });
        return;
    }
    if (typeof window.sendAdminCodeToEmail === 'function') {
        window.sendAdminCodeToEmail(email, code, purpose);
        return;
    }
    showCodeBanner(email, code, false);
}

function showCodeBanner(email, code, sent) {
    var banner = document.getElementById('adminCodeBanner');
    if (!banner && document.getElementById('loginSection')) {
        banner = document.createElement('div');
        banner.id = 'adminCodeBanner';
        banner.className = 'code-sent-banner';
        banner.setAttribute('role', 'alert');
        document.getElementById('loginSection').insertBefore(banner, document.getElementById('loginSection').firstChild);
    }
    if (banner) {
        banner.textContent = sent
            ? 'Code sent to ' + email + '. Check your inbox.'
            : 'Code sent to ' + email + ' (use this code for testing: ' + code + '). Expires in 10 minutes.';
        banner.style.display = 'block';
        setTimeout(function () { banner.style.display = 'none'; }, sent ? 15000 : 60000);
    }
}
// Use DELIVERY_FEE from window or default to 200
const DELIVERY_FEE = (typeof window !== 'undefined' && window.DELIVERY_FEE) ? window.DELIVERY_FEE : 200;

// Load orders from localStorage
function loadOrders() {
    const savedOrders = localStorage.getItem('slayStationOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    renderOrders();
}

// Save orders to localStorage
function saveOrders() {
    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
}

// Step 1: Validate email (allowed only) + password, then send code and show code step. Returns true if code was sent (or sending).
function requestLoginCode() {
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const errorMsg = document.getElementById('loginError');
    if (!emailInput) return false;
    const email = emailInput.value.trim();
    const password = (passwordInput && passwordInput.value) ? passwordInput.value : '';
    if (!email) {
        if (errorMsg) { errorMsg.textContent = 'Please enter your email address'; errorMsg.style.display = 'block'; }
        return false;
    }
    if (!password) {
        if (errorMsg) { errorMsg.textContent = 'Please enter the admin password'; errorMsg.style.display = 'block'; }
        return false;
    }
    const api = typeof window !== 'undefined' && window.SlayStationAdminFirebase;
    if (api && api.available) {
        errorMsg.style.display = 'none';
        api.getAdminAllowedEmails().then(function (data) {
            const allowed = (data && data.allowedEmails) ? data.allowedEmails : [];
            const normalized = email.toLowerCase().trim();
            if (!allowed.some(function (e) { return String(e).toLowerCase() === normalized; })) {
                if (errorMsg) { errorMsg.textContent = 'This email is not allowed to log in as admin. Access denied.'; errorMsg.style.display = 'block'; }
                return;
            }
            api.verifyAdminPassword(email, password).then(function (result) {
                if (!result || !result.ok) {
                    if (errorMsg) { errorMsg.textContent = 'Invalid password. Access denied.'; errorMsg.style.display = 'block'; }
                    return;
                }
                const code = generateLoginCode();
                storeLoginCode(email, code, 'adminLogin');
                sendCodeToEmail(email, code, 'login');
                if (errorMsg) errorMsg.style.display = 'none';
                window._adminPendingEmail = email;
                const loginSection = document.getElementById('loginSection');
                const codeStep = document.getElementById('loginCodeStep');
                const form = loginSection && loginSection.querySelector('form');
                if (form) form.style.display = 'none';
                if (codeStep) codeStep.style.display = 'block';
            }).catch(function (err) {
                const msg = (err && err.message) ? err.message : 'Invalid password or server error.';
                if (errorMsg) { errorMsg.textContent = msg; errorMsg.style.display = 'block'; }
            });
        }).catch(function (err) {
            if (errorMsg) { errorMsg.textContent = 'Could not verify admin. Try again.'; errorMsg.style.display = 'block'; }
        });
        return true;
    }
    if (!isAdminEmail(email)) {
        if (errorMsg) { errorMsg.textContent = 'This email is not allowed to log in as admin. Access denied.'; errorMsg.style.display = 'block'; }
        return false;
    }
    const storedPassword = getStoredAdminPassword();
    if (password !== storedPassword) {
        if (errorMsg) { errorMsg.textContent = 'Invalid password. Access denied.'; errorMsg.style.display = 'block'; }
        return false;
    }
    const code = generateLoginCode();
    storeLoginCode(email, code, 'adminLogin');
    sendCodeToEmail(email, code, 'login');
    if (errorMsg) errorMsg.style.display = 'none';
    window._adminPendingEmail = email;
    return true;
}

// Step 2: Verify code and complete login
function verifyLoginCodeAndLogin() {
    const email = window._adminPendingEmail;
    const codeInput = document.getElementById('adminLoginCode');
    const code = (codeInput && codeInput.value) ? codeInput.value.trim() : '';
    const errorEl = document.getElementById('loginCodeError');
    if (!email) {
        if (errorEl) errorEl.textContent = 'Session expired. Please start over.';
        return false;
    }
    if (!code || code.length !== 6) {
        if (errorEl) errorEl.textContent = 'Please enter the 6-digit code.';
        return false;
    }
    const stored = getStoredLoginCode(email, 'adminLogin');
    if (!stored || stored !== code) {
        if (errorEl) errorEl.textContent = 'Invalid or expired code. Request a new one.';
        return false;
    }
    try { sessionStorage.removeItem('adminLogin_' + email.toLowerCase().trim()); } catch (e) {}
    window._adminPendingEmail = null;
    if (errorEl) errorEl.textContent = '';
    if (codeInput) codeInput.value = '';
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    const codeStep = document.getElementById('loginCodeStep');
    if (loginSection) loginSection.querySelector('form').style.display = '';
    if (codeStep) codeStep.style.display = 'none';
    localStorage.setItem('slayStationAdminLoggedIn', 'true');
    localStorage.setItem('slayStationAdminEmail', email);
    if (loginSection) loginSection.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    if (document.body) document.body.classList.remove('login-page-active');
    loadOrders();
    return true;
}

// Forgot password: send code to allowed email only (Firebase sends real email and stores code in Firestore)
function sendForgotPasswordCode(email) {
    const e = (email || '').trim().toLowerCase();
    const api = typeof window !== 'undefined' && window.SlayStationAdminFirebase;
    if (api && api.available && api.sendForgotPasswordCode) {
        return api.sendForgotPasswordCode(e).then(function (data) {
            if (data && data.ok) return { ok: true };
            return { ok: false, message: 'Could not send code.' };
        }).catch(function (err) {
            return { ok: false, message: (err && err.message) ? err.message : 'Could not send code.' };
        });
    }
    if (!isAdminEmail(e)) return Promise.resolve({ ok: false, message: 'This email is not allowed. Only admin emails can reset password.' });
    const code = generateLoginCode();
    storeLoginCode(e, code, 'forgotPassword');
    sendCodeToEmail(e, code, 'forgot');
    return Promise.resolve({ ok: true });
}

// Forgot password: verify code and set new password (Firebase path: updates Firestore; local path: localStorage override)
function verifyForgotCodeAndSetPassword(email, code, newPassword, confirmPassword) {
    const e = (email || '').trim().toLowerCase();
    const api = typeof window !== 'undefined' && window.SlayStationAdminFirebase;
    if (api && api.available && api.resetAdminPassword) {
        if (!newPassword || newPassword.length < 6) return Promise.resolve({ ok: false, message: 'Password must be at least 6 characters.' });
        if (newPassword !== confirmPassword) return Promise.resolve({ ok: false, message: 'Passwords do not match.' });
        return api.resetAdminPassword(e, String(code).trim(), newPassword).then(function (data) {
            if (data && data.ok) return { ok: true };
            return { ok: false, message: 'Invalid or expired code.' };
        }).catch(function (err) {
            return { ok: false, message: (err && err.message) ? err.message : 'Invalid or expired code.' };
        });
    }
    if (!isAdminEmail(e)) return Promise.resolve({ ok: false, message: 'Email not allowed.' });
    const stored = getStoredLoginCode(e, 'forgotPassword');
    if (!stored || stored !== code) return Promise.resolve({ ok: false, message: 'Invalid or expired code.' });
    if (!newPassword || newPassword.length < 6) return Promise.resolve({ ok: false, message: 'Password must be at least 6 characters.' });
    if (newPassword !== confirmPassword) return Promise.resolve({ ok: false, message: 'Passwords do not match.' });
    try {
        sessionStorage.removeItem('forgotPassword_' + e);
        localStorage.setItem('slayStationAdminPasswordOverride', newPassword);
    } catch (err) { return Promise.resolve({ ok: false, message: 'Could not save.' }); }
    return Promise.resolve({ ok: true });
}

// Authenticate admin (legacy: direct login without code; used when code step is skipped or from prompt fallback)
function authenticateAdmin() {
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    if (!emailInput) {
        const email = prompt('Enter admin email:');
        const password = prompt('Enter admin password:');
        if (email && isAdminEmail(email) && password === getStoredAdminPassword()) {
            const loginSection = document.getElementById('loginSection');
            const adminDashboard = document.getElementById('adminDashboard');
            if (loginSection) loginSection.style.display = 'none';
            if (adminDashboard) adminDashboard.style.display = 'block';
            loadOrders();
            return true;
        }
        alert('Invalid email or password! Access denied.');
        return false;
    }
    const email = emailInput.value.trim();
    const password = (passwordInput && passwordInput.value) ? passwordInput.value : '';
    const errorMsg = document.getElementById('loginError');
    if (!email) {
        if (errorMsg) { errorMsg.textContent = 'Please enter your email address'; errorMsg.style.display = 'block'; }
        return false;
    }
    if (!password) {
        if (errorMsg) { errorMsg.textContent = 'Please enter the admin password'; errorMsg.style.display = 'block'; }
        return false;
    }
    if (!isAdminEmail(email)) {
        if (errorMsg) { errorMsg.textContent = 'This email is not allowed. Access denied.'; errorMsg.style.display = 'block'; }
        return false;
    }
    if (password !== getStoredAdminPassword()) {
        if (errorMsg) { errorMsg.textContent = 'Invalid password! Access denied.'; errorMsg.style.display = 'block'; }
        return false;
    }
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    if (loginSection) loginSection.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    if (errorMsg) errorMsg.style.display = 'none';
    if (document.body) document.body.classList.remove('login-page-active');
    if (passwordInput) passwordInput.value = '';
    localStorage.setItem('slayStationAdminLoggedIn', 'true');
    localStorage.setItem('slayStationAdminEmail', email);
    loadOrders();
    return true;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.adminGoogleSignIn = adminGoogleSignIn;
    window.showAdminDashboard = showAdminDashboard;
    window.authenticateAdmin = authenticateAdmin;
    window.requestLoginCode = requestLoginCode;
    window.verifyLoginCodeAndLogin = verifyLoginCodeAndLogin;
    window.sendForgotPasswordCode = sendForgotPasswordCode;
    window.verifyForgotCodeAndSetPassword = verifyForgotCodeAndSetPassword;
    window.getStoredAdminPassword = getStoredAdminPassword;
    window.loadOrders = loadOrders;
    window.isAdminEmail = isAdminEmail;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
    window.setDeliveryFee = setDeliveryFee;
    window.confirmAndDispatchNairobi = confirmAndDispatchNairobi;
    window.verifyMpesaCode = verifyMpesaCode;
    window.rejectMpesaCode = rejectMpesaCode;
    window.selectRiderForDispatch = selectRiderForDispatch;
    window.quickConfirm = quickConfirm;
    window.quickDispatch = quickDispatch;
}

// Render orders
function renderOrders() {
    // Check if filters are active
    const searchInput = document.getElementById('orderSearchInput');
    const hasActiveFilters = searchInput && searchInput.value.trim() !== '';
    
    // If filters are active, use filtered orders, otherwise use all orders
    if (hasActiveFilters || filteredOrders.length > 0) {
        if (typeof filterOrders === 'function') {
            filterOrders();
            return;
        }
    }
    
    // Reset filtered orders if no filters
    filteredOrders = [];
    
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No orders yet! 💝</p>';
        updateStats();
        return;
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const statusClass = getStatusClass(order.status);
        const statusIcon = getStatusIcon(order.status);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <p class="order-date">${new Date(order.date).toLocaleString()}</p>
                    <p class="order-customer"><strong>${order.name}</strong> - ${order.email}</p>
                    <p class="order-phone">📱 ${order.phone}</p>
                    <p class="order-address">📍 ${order.address}</p>
                </div>
                <div class="order-status ${statusClass}">
                    <span>${statusIcon} ${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <!-- Customer Communication -->
            <div class="order-contact-wrap" style="margin-bottom: 0.6rem; padding: 0.5rem 0.75rem; background: #f5f5f5; border-radius: 8px;">
                <p style="margin: 0 0 0.4rem 0; font-weight: 600; font-size: 0.8rem; color: var(--admin-text);">📞 Contact:</p>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <button class="comm-btn call-btn" onclick="adminCallCustomer('${order.phone}')" title="Call">📞</button>
                    <button class="comm-btn sms-btn" onclick="adminSmsCustomer('${order.phone}', ${order.id})" title="SMS">💬</button>
                    <button class="comm-btn whatsapp-btn" onclick="adminWhatsappCustomer('${order.phone}', ${order.id})" title="WhatsApp">WhatsApp</button>
                    ${order.deliveryProof ? `
                        <button class="comm-btn proof-btn" onclick="viewDeliveryProof(${order.id})" title="View Delivery Proof" style="background: #9C27B0; color: white;">
                            📸 Proof
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="order-items">
                <h4>Items:</h4>
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <span>${item.name} x${item.quantity}</span>
                        <span>KSH ${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                `).join('')}
                ${order.giftWrap ? '<div class="order-item-row"><span>Gift Card with Message 💌</span><span>KSH 80</span></div>' : ''}
                <div class="order-item-row total-row">
                    <strong>Subtotal:</strong>
                    <strong>KSH ${order.subtotal.toLocaleString()}</strong>
                </div>
                <div class="order-item-row">
                    <span>Delivery Fee:</span>
                    ${order.deliveryFee === null || order.deliveryFee === undefined ? 
                        `<span style="color: #ff9800;">⏳ Pending Admin Input</span>` :
                        `<span class="${order.deliveryFeePaid ? 'paid' : 'unpaid'}">KSH ${order.deliveryFee.toLocaleString()} ${order.deliveryFeePaid ? '✅ Paid' : '❌ Unpaid'}</span>`
                    }
                    ${order.outsideNairobi ? 
                        `<div style="font-size: 0.85rem; color: #ff9800; margin-top: 0.25rem; font-weight: 600;">
                            🌍 Outside Nairobi - Manual fee required
                        </div>` : ''
                    }
                    ${order.deliveryFeeAutoCalculated && order.deliveryDistance && order.withinNairobi ? 
                        `<div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                            📍 Auto-calculated (${order.deliveryDistance} km from Westlands Market, KSH 40/km)
                        </div>` : ''
                    }
                </div>
                ${order.mpesaCode ? `
                <div class="order-item-row">
                    <span>M-Pesa Code:</span>
                    <span style="font-family: monospace; background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 5px;">${order.mpesaCode}</span>
                </div>
                ` : ''}
                <div class="order-item-row total-row">
                    <strong>Total:</strong>
                    <strong>KSH ${order.total.toLocaleString()}</strong>
                </div>
                <div class="order-item-row">
                    <span>Payment Method:</span>
                    <span>${order.payment}</span>
                </div>
            </div>
            
            <div class="order-actions">
                ${order.deliveryFee === null || order.deliveryFee === undefined ? `
                    ${order.outsideNairobi ? `
                        <!-- Only show delivery fee input for orders outside Nairobi -->
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #ffe6e6; border-radius: 10px; border: 2px solid #ff6b6b;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                🌍 Set Delivery Fee (Outside Nairobi):
                            </label>
                            <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: #fff; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                                <div style="font-weight: 600; color: #d32f2f; margin-bottom: 0.25rem;">
                                    ⚠️ Address is outside Nairobi
                                </div>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                                    Please set the delivery fee manually. Customer will be notified when you set the fee.
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" id="deliveryFeeInput_${order.id}" 
                                    placeholder="Enter amount" 
                                    min="0" 
                                    style="flex: 1; padding: 0.5rem; border: 2px solid #ddd; border-radius: 5px;">
                                <button class="mark-paid-btn" onclick="setDeliveryFee(${order.id})">Set Fee 💰</button>
                            </div>
                        </div>
                    ` : order.withinNairobi && order.deliveryFeeAutoCalculated && order.deliveryFee ? `
                        <!-- For Nairobi orders with auto-calculated fee, auto-confirm and dispatch -->
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #e7f3ff; border-radius: 10px; border: 2px solid #2196F3;">
                            <div style="font-weight: 600; color: #1976D2; margin-bottom: 0.5rem;">
                                ✅ Nairobi Delivery - Auto-Confirmed
                            </div>
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem;">
                                Delivery Fee: KSH ${order.deliveryFee.toLocaleString()} (Auto-calculated)
                                ${order.deliveryDistance ? ` - ${order.deliveryDistance} km` : ''}
                            </div>
                            ${order.payment === 'mpesa' && order.mpesaCode ? `
                                <div style="background: #e8f5e9; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #4CAF50;">
                                    <div style="font-weight: 600; color: #2e7d32; margin-bottom: 0.25rem;">
                                        💳 Payment Confirmed
                                    </div>
                                    <div style="font-size: 0.85rem; color: #666;">
                                        M-Pesa Code: <strong>${order.mpesaCode}</strong>
                                    </div>
                                </div>
                            ` : ''}
                            <button class="mark-paid-btn" onclick="confirmAndDispatchNairobi(${order.id})" 
                                style="width: 100%; background: linear-gradient(135deg, #4CAF50, #45a049);">
                                ✅ Confirm Payment & Dispatch Order
                            </button>
                        </div>
                    ` : ''}
                ` : ''}
                ${order.mpesaCode ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: ${order.mpesaCodeVerified ? '#d4edda' : '#d1ecf1'}; border-radius: 10px; border: 2px solid ${order.mpesaCodeVerified ? '#155724' : '#0c5460'};">
                        <p style="margin-bottom: 0.5rem;">
                            <strong>M-Pesa Code:</strong> 
                            <span style="font-family: monospace; background: white; padding: 0.25rem 0.5rem; border-radius: 5px; font-weight: 600; font-size: 1.1rem;">${order.mpesaCode}</span>
                            ${order.mpesaCodeVerified ? '<span style="color: #155724; margin-left: 0.5rem;">✅ Verified</span>' : '<span style="color: #0c5460; margin-left: 0.5rem;">⏳ Pending Verification</span>'}
                        </p>
                        ${order.mpesaReference ? `<p style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">Order ref: <strong>${order.mpesaReference}</strong></p>` : ''}
                        ${order.mpesaCodeSubmittedTime ? `<p style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Submitted: ${new Date(order.mpesaCodeSubmittedTime).toLocaleString()}</p>` : ''}
                        ${!order.mpesaCodeVerified ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button class="mark-paid-btn" onclick="verifyMpesaCode(${order.id})" style="flex: 1; min-width: 150px;">Verify & Mark Paid ✅</button>
                                <button class="delete-order-btn" onclick="rejectMpesaCode(${order.id})" style="background: #dc3545; flex: 1; min-width: 150px;">Reject Code ❌</button>
                            </div>
                            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">After approval you can dispatch; after reject customer can submit a new code.</p>
                        ` : ''}
                    </div>
                ` : ''}
                ${order.deliveryFeeSet && !order.deliveryFeePaid && order.items && order.items.length ? (function() {
                    var imgs = order.items.slice(0, 4).map(function(item) {
                        var src = (item.image && (item.image.indexOf('images/') !== -1 || item.image.indexOf('/') !== -1)) ? item.image : 'images/bags/img_1328.jpg';
                        var alt = (item.name || 'Product').replace(/"/g, '&quot;');
                        return '<img src="' + src + '" alt="' + alt + '" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0;" onerror="this.onerror=null; this.src=\'images/bags/img_1328.jpg\'; this.alt=\'Product\';">';
                    });
                    return '<div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 10px; border: 2px solid #e0e0e0;"><p style="margin-bottom: 0.5rem; font-weight: 600; color: var(--admin-text);">Product</p><div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">' + imgs.join('') + '</div></div>';
                })() : ''}
                ${order.assignedRider ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 10px; border: 2px solid #2196f3;">
                        <p style="margin-bottom: 0.5rem;"><strong>🚚 Assigned Rider:</strong></p>
                        <p style="color: #1976d2; font-weight: 600;">${order.assignedRider}</p>
                        ${order.assignedTime ? `<p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">Assigned: ${new Date(order.assignedTime).toLocaleString()}</p>` : ''}
                    </div>
                ` : ''}
                <input type="checkbox" class="order-checkbox" value="${order.id}" onchange="updateBulkSelection()" style="margin-right: 0.5rem;">
                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="quick-action-btn" onclick="quickConfirm(${order.id})" title="Quick Confirm" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">✅</button>
                <button class="quick-action-btn" onclick="quickDispatch(${order.id})" title="Quick Dispatch" style="padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🚚</button>
                <button class="delete-order-btn" onclick="deleteOrder(${order.id})">Delete Order</button>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
    
    updateStats();
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'processing': 'status-processing',
        'dispatched': 'status-dispatched',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'confirmed': '✅',
        'processing': '🔄',
        'dispatched': '🚚',
        'delivered': '🎉',
        'cancelled': '❌'
    };
    return icons[status] || '⏳';
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // If changing to dispatched, show rider selection
    if (newStatus === 'dispatched' && order.status !== 'dispatched') {
        selectRiderForDispatch(orderId);
        return;
    }
    
    // For other status changes, update directly
    const oldStatus = order.status;
    order.status = newStatus;
    if (newStatus === 'dispatched') {
        order.dispatchTime = new Date().toISOString();
    }
    saveOrders();
    renderOrders();
    showNotification(`Order #${orderId} → ${newStatus}. Customer will see this when they open or refresh their track order page. ✨`);
    
    if (typeof window.notifyOrderStatusChange === 'function') {
        window.notifyOrderStatusChange(orderId, newStatus, oldStatus);
    }
}

// Quick confirm: set order status to confirmed
function quickConfirm(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const oldStatus = order.status;
    order.status = 'confirmed';
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'order_confirmed',
        message: 'Your order has been confirmed and is being prepared!',
        date: new Date().toISOString(),
        read: false
    });
    saveOrders();
    renderOrders();
    showNotification(`Order #${orderId} confirmed. ✨`);
    if (typeof window.notifyOrderStatusChange === 'function') {
        window.notifyOrderStatusChange(orderId, 'confirmed', oldStatus);
    }
}

// Quick dispatch: open rider selection modal (allocate rider)
function quickDispatch(orderId) {
    selectRiderForDispatch(orderId);
}

// Select rider for dispatch
function selectRiderForDispatch(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const RIDER_EMAILS = [
        'preston.mwendwa@riarauniversity.ac.ke',
        'kangethekelvin56@gmail.com'
    ];
    
    // Create rider selection modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 5000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: var(--dark);">🚚 Select Rider for Dispatch</h2>
        <p style="color: #666; margin-bottom: 1.5rem;">Choose which rider to assign Order #${orderId} to:</p>
        <select id="riderSelect" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 1rem; margin-bottom: 1.5rem;">
            <option value="">-- Select Rider --</option>
            ${RIDER_EMAILS.map(email => `
                <option value="${email}">${email}</option>
            `).join('')}
        </select>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap; margin-top: 1rem;">
            <button type="button" id="cancelDispatch" style="padding: 0.75rem 1.5rem; border: 2px solid #ddd; background: #fff; color: #333; border-radius: 10px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Cancel</button>
            <button type="button" id="confirmDispatch" style="padding: 0.75rem 1.5rem; background: #2196F3; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; box-shadow: 0 2px 8px rgba(33,150,243,0.4);">Dispatch Order</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Handle cancel
    document.getElementById('cancelDispatch').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Handle confirm
    document.getElementById('confirmDispatch').onclick = () => {
        const selectedRider = document.getElementById('riderSelect').value;
        if (!selectedRider) {
            alert('Please select a rider!');
            return;
        }
        
        order.status = 'dispatched';
        order.dispatchTime = new Date().toISOString();
        order.assignedRider = selectedRider;
        order.assignedTime = new Date().toISOString();
        // Map data: store + rider at store until rider starts delivery; customer default for Nairobi area
        order.storeLocation = order.storeLocation || { x: 20, y: 70 };
        order.customerLocation = order.customerLocation || { x: 75, y: 25 };
        order.riderLocation = { x: order.storeLocation.x, y: order.storeLocation.y };
        
        // Add notification
        order.notifications = order.notifications || [];
        order.notifications.push({
            type: 'order_dispatched',
            message: `Your order has been dispatched! Rider: ${selectedRider}`,
            date: new Date().toISOString(),
            read: false
        });
        
        saveOrders();
        renderOrders();
        document.body.removeChild(modal);
        showNotification(`Order #${orderId} dispatched. Customer will see "Dispatched" on their track order page when they refresh. 🚚`);
        if (typeof window.notifyOrderStatusChange === 'function') {
            window.notifyOrderStatusChange(orderId, 'dispatched', order.status);
        }
    };
}

// Set delivery fee (admin sets the fee)
function setDeliveryFee(orderId, useAutoCalculated = false) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let fee;
    
    if (useAutoCalculated && order.deliveryFeeAutoCalculated && order.deliveryFee) {
        // Use the auto-calculated fee
        fee = order.deliveryFee;
    } else {
        // Get fee from input field
        const feeInput = document.getElementById(`deliveryFeeInput_${orderId}`);
        if (!feeInput) return;
        
        fee = parseFloat(feeInput.value);
        if (isNaN(fee) || fee < 0) {
            alert('Please enter a valid delivery fee amount!');
            return;
        }
    }
    
    order.deliveryFee = fee;
    order.deliveryFeeSet = true;
    order.deliveryFeeSetTime = new Date().toISOString();
    order.total = order.subtotal + (order.giftWrap ? 80 : 0) + fee;
    
    // Mark that STK push should be sent (simulated)
    order.mpesaStkPushSent = true;
    order.mpesaStkPushTime = new Date().toISOString();
    
    saveOrders();
    renderOrders();
    
    // Notify customer
    if (typeof window.notifyDeliveryFeeSet === 'function') {
        window.notifyDeliveryFeeSet(orderId, fee);
    }
    
    // Notify customer (store notification in order)
    order.deliveryFeeNotificationSent = true;
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'delivery_fee_set',
        message: `📱 M-Pesa Payment Request: You will receive a payment prompt on your phone for KSH ${fee.toLocaleString()}. Just enter your M-Pesa PIN when prompted!`,
        date: new Date().toISOString()
    });
    saveOrders();
    
    showNotification(`Delivery fee set to KSH ${fee.toLocaleString()} for Order #${orderId}! Customer will be notified. 📧`);
}

// Auto-confirm payment and dispatch for Nairobi deliveries
function confirmAndDispatchNairobi(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.withinNairobi) {
        alert('This function is only for Nairobi deliveries!');
        return;
    }
    
    if (!order.deliveryFeeAutoCalculated || !order.deliveryFee) {
        alert('Delivery fee not calculated! Please set it first.');
        return;
    }
    
    // Confirm payment (if M-Pesa code exists)
    if (order.payment === 'mpesa' && order.mpesaCode) {
        order.deliveryFeePaid = true;
        order.deliveryFeePaidTime = new Date().toISOString();
        order.mpesaCodeVerified = true;
    } else if (order.payment === 'mpesa') {
        // If M-Pesa but no code yet, mark as pending payment
        order.deliveryFeePaid = false;
    } else {
        // Cash on delivery
        order.deliveryFeePaid = false;
    }
    
    // Set delivery fee
    order.deliveryFeeSet = true;
    order.deliveryFeeSetTime = new Date().toISOString();
    order.total = order.subtotal + (order.giftWrap ? 80 : 0) + order.deliveryFee;
    
    // Update status to confirmed and then dispatch
    const oldStatus = order.status;
    order.status = 'confirmed';
    
    // Auto-dispatch
    order.status = 'dispatched';
    order.dispatchTime = new Date().toISOString();
    
    // Add notifications
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'order_confirmed',
        message: `✅ Your order has been confirmed and is being prepared!`,
        date: new Date().toISOString()
    });
    order.notifications.push({
        type: 'order_dispatched',
        message: `🚚 Your order has been dispatched! It's on the way to you.`,
        date: new Date().toISOString()
    });
    
    saveOrders();
    renderOrders();
    
    // Trigger notifications
    if (typeof window.notifyOrderStatusChange === 'function') {
        window.notifyOrderStatusChange(orderId, 'confirmed', oldStatus);
        window.notifyOrderStatusChange(orderId, 'dispatched', 'confirmed');
    }
    
    showNotification(`Order #${orderId} confirmed and dispatched! 🚚`);
}

// Verify M-Pesa code and mark as paid
function verifyMpesaCode(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.mpesaCode) {
        alert('No M-Pesa code found for this order!');
        return;
    }
    
    if (confirm(`Verify M-Pesa code ${order.mpesaCode} for Order #${orderId}?\n\nDelivery Fee: KSH ${order.deliveryFee.toLocaleString()}\n\nThis will mark the delivery fee as paid and move the order to processing.`)) {
        order.deliveryFeePaid = true;
        order.deliveryFeePaidTime = new Date().toISOString();
        order.mpesaCodeVerified = true;
        const oldStatus = order.status;
        order.status = 'processing'; // Move to processing after payment verified
        
        // Notify customer
        if (typeof window.notifyPaymentReceived === 'function') {
            window.notifyPaymentReceived(orderId);
        }
        
        if (typeof window.notifyOrderStatusChange === 'function') {
            window.notifyOrderStatusChange(orderId, 'processing', oldStatus);
        }
        
        order.notifications = order.notifications || [];
        order.notifications.push({
            type: 'payment_verified',
            message: `✅ Your M-Pesa payment (Code: ${order.mpesaCode}) has been verified! Your order is now being processed.`,
            date: new Date().toISOString(),
            read: false
        });
        
        saveOrders();
        renderOrders();
        showNotification(`✅ M-Pesa code verified! Order #${orderId} marked as paid and moved to processing!`);
    }
}

// Reject M-Pesa code
function rejectMpesaCode(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.mpesaCode) {
        alert('No M-Pesa code found for this order!');
        return;
    }
    
    const reason = prompt(`Enter reason for rejecting M-Pesa code ${order.mpesaCode} (optional):`);
    const rejectedCode = order.mpesaCode; // Save the rejected code for notification
    order.mpesaCode = null; // Clear code so customer can submit new one
    order.mpesaCodeRejected = true;
    order.mpesaCodeRejectionReason = reason || 'Invalid code';
    order.mpesaCodeVerified = false;
    
    // Notify customer
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'payment_rejected',
        message: `❌ Your M-Pesa code (${rejectedCode}) was rejected. ${reason ? 'Reason: ' + reason : 'Please submit a valid M-Pesa confirmation code.'}`,
        date: new Date().toISOString(),
        read: false
    });
    
    saveOrders();
    renderOrders();
    showNotification(`❌ M-Pesa code rejected for Order #${orderId}. Customer will be notified.`);
}

// Delete order
function deleteOrder(orderId) {
    if (confirm(`Are you sure you want to delete Order #${orderId}?`)) {
        orders = orders.filter(o => o.id !== orderId);
        saveOrders();
        renderOrders();
        showNotification(`Order #${orderId} deleted!`);
    }
}

// Update statistics
function updateStats() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
    const dispatchedOrders = orders.filter(o => o.status === 'dispatched').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('processingOrders').textContent = processingOrders;
    document.getElementById('dispatchedOrders').textContent = dispatchedOrders;
    document.getElementById('deliveredOrders').textContent = deliveredOrders;
    document.getElementById('totalRevenue').textContent = `KSH ${totalRevenue.toLocaleString()}`;
}

// Show notification
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

// Initialize on load: restore session from Firebase Auth (Google); if no auth or not admin, show login
function runAdminAuthInit() {
    var loginSection = document.getElementById('loginSection');
    var adminDashboard = document.getElementById('adminDashboard');
    if (!loginSection || !adminDashboard) return;
    initAdminAuthState();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAdminAuthInit);
} else {
    runAdminAuthInit();
}

// Export function to create orders (called from checkout)
if (typeof window !== 'undefined') {
    window.createOrder = function(orderData) {
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        
        const order = {
                id: orderId,
                date: new Date().toISOString(),
                ...orderData,
                status: 'pending',
                deliveryFee: orderData.deliveryFee ?? null,
                deliveryFeePaid: false,
                deliveryFeeSet: !!orderData.deliveryFeeAutoCalculated,
                deliveryFeeNotificationSent: false,
                mpesaCode: null,
                mpesaReference: 'SLY' + orderId + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                notifications: [],
                subtotal: orderData.subtotal || orderData.total,
                total: orderData.total != null ? orderData.total : ((orderData.subtotal || 0) + (orderData.deliveryFee || 0))
            };
        
        orders.push(order);
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        return order;
    };
}
