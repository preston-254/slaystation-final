// Order Status Notifications System

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Show browser notification
function showBrowserNotification(title, message, icon = '✨') {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: message,
            icon: '/favicon.ico', // You can add a custom icon
            badge: '/favicon.ico',
            tag: 'slaystation-order',
            requireInteraction: false
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

// Show in-app notification
function showInAppNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.in-app-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `in-app-notification in-app-notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        order: '📦'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Add notification to order
function addOrderNotification(orderId, message, type = 'info') {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        if (!order.notifications) {
            order.notifications = [];
        }
        
        order.notifications.push({
            message: message,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Keep only last 20 notifications
        if (order.notifications.length > 20) {
            order.notifications = order.notifications.slice(-20);
        }
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = order;
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
    }
}

// Notify order status change
function notifyOrderStatusChange(orderId, newStatus, oldStatus) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const statusMessages = {
        'pending': 'Your order is being processed',
        'processing': 'Your order is being prepared',
        'dispatched': 'Your order has been dispatched! A rider is on the way 🚚',
        'delivered': 'Your order has been delivered! Enjoy your purchase 🎉',
        'cancelled': 'Your order has been cancelled'
    };
    
    const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;
    const notificationMessage = `Order #${orderId}: ${message}`;
    
    // Show browser notification
    showBrowserNotification('Order Update', notificationMessage);
    
    // Show in-app notification
    showInAppNotification(notificationMessage, 'order', 7000);
    
    // Add to order notifications
    addOrderNotification(orderId, message, newStatus === 'delivered' ? 'success' : 'info');
    
    // Update notification badge if user is logged in
    updateNotificationBadge();
}

// Notify delivery fee set
function notifyDeliveryFeeSet(orderId, fee) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const message = `📱 M-Pesa Payment Prompt: You will receive a payment request on your phone for Order #${orderId} (KSH ${fee.toLocaleString()}). Just enter your M-Pesa PIN when prompted!`;
    
    // Show browser notification
    showBrowserNotification('📱 M-Pesa Payment Request', `Check your phone! Enter your M-Pesa PIN when prompted. Amount: KSH ${fee.toLocaleString()}`);
    
    // Show in-app notification with longer duration
    showInAppNotification(message, 'order', 10000);
    
    // Add to order notifications
    addOrderNotification(orderId, `M-Pesa payment prompt sent. Enter PIN on your phone. Amount: KSH ${fee.toLocaleString()}`, 'info');
    
    updateNotificationBadge();
}

// Notify payment received
function notifyPaymentReceived(orderId) {
    const message = `Payment for Order #${orderId} has been confirmed! Your order will be processed soon.`;
    
    // Show browser notification
    showBrowserNotification('Payment Confirmed', message);
    
    // Show in-app notification
    showInAppNotification(message, 'success', 7000);
    
    // Add to order notifications
    addOrderNotification(orderId, 'Payment confirmed', 'success');
    
    updateNotificationBadge();
}

// Update notification badge
function updateNotificationBadge() {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
    
    if (!user) return;
    
    // Count unread notifications for user's orders
    let unreadCount = 0;
    orders.forEach(order => {
        if (order.userId === user.id && order.notifications) {
            unreadCount += order.notifications.filter(n => !n.read).length;
        }
    });
    
    // Update badge if it exists
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mark notifications as read
function markNotificationsAsRead(orderId) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order && order.notifications) {
        order.notifications.forEach(notif => {
            notif.read = true;
        });
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = order;
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
        
        updateNotificationBadge();
    }
}

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
    // Request permission
    requestNotificationPermission();
    
    // Update badge
    updateNotificationBadge();
    
    // Check for new notifications every 10 seconds
    setInterval(() => {
        updateNotificationBadge();
    }, 10000);
});

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showBrowserNotification = showBrowserNotification;
    window.showInAppNotification = showInAppNotification;
    window.notifyOrderStatusChange = notifyOrderStatusChange;
    window.notifyDeliveryFeeSet = notifyDeliveryFeeSet;
    window.notifyPaymentReceived = notifyPaymentReceived;
    window.updateNotificationBadge = updateNotificationBadge;
    window.markNotificationsAsRead = markNotificationsAsRead;
    window.addOrderNotification = addOrderNotification;
}

