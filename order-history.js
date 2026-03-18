/**
 * Order History – list orders for logged-in user and link to track rider
 */
(function () {
    'use strict';

    function getCurrentUser() {
        try {
            if (typeof userAuth !== 'undefined' && userAuth && userAuth.getCurrentUser) {
                return userAuth.getCurrentUser();
            }
            var raw = localStorage.getItem('slayStationCurrentUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function getOrders() {
        try {
            var raw = localStorage.getItem('slayStationOrders');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function statusClass(s) {
        if (!s) return 'status-pending';
        s = s.toLowerCase();
        if (s === 'delivered' || s === 'completed') return 'status-delivered';
        if (s === 'dispatched' || s === 'processing') return 'status-processing';
        if (s === 'cancelled') return 'status-cancelled';
        return 'status-pending';
    }

    function formatDate(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function formatStatus(s) {
        if (!s) return 'Pending';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderOrders(orders, container) {
        container.innerHTML = '';
        if (!orders.length) {
            container.innerHTML = '<p class="account-history-empty">No orders yet. <a href="index.html#products">Start shopping</a>.</p>';
            return;
        }
        orders.forEach(function (order) {
            var card = document.createElement('div');
            card.className = 'order-history-card';
            var items = order.items || [];
            var itemsHtml = items.length
                ? items.map(function (i) {
                    return '<div class="order-item-row"><span>' + escapeHtml(i.name || 'Item') + ' × ' + (i.quantity || 1) + '</span><span>KSH ' + ((i.price || 0) * (i.quantity || 1)).toLocaleString() + '</span></div>';
                }).join('')
                : '<div class="order-item-row"><span>No items</span><span>—</span></div>';
            var total = order.total != null ? order.total : 0;
            var trackOrderUrl = 'track-order.html?order=' + order.id;
            var trackBtn = '<a href="' + trackOrderUrl + '" class="order-track-btn"><span>📍</span> Track order</a>';
            var address = (order.address || '').trim();
            var mapQuery = address ? encodeURIComponent(address) : '';
            var mapSection = '';
            if (mapQuery) {
                var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + mapQuery;
                var embedUrl = 'https://www.google.com/maps?q=' + mapQuery + '&output=embed';
                mapSection =
                    '<div class="order-history-map-wrap">' +
                    '<h4 class="order-history-map-title">Delivery location</h4>' +
                    '<a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" class="order-history-map-link">Open in Google Maps ↗</a>' +
                    '<iframe class="order-history-map-iframe" src="' + embedUrl + '" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Delivery location on Google Maps"></iframe>' +
                    '</div>';
            }
            card.innerHTML =
                '<div class="order-history-header">' +
                '<div class="order-info">' +
                '<h3>Order #' + order.id + '</h3>' +
                '<p class="order-date">' + escapeHtml(formatDate(order.date)) + '</p>' +
                (address ? '<p class="order-address">' + escapeHtml(address) + '</p>' : '') +
                '</div>' +
                '<span class="order-status ' + statusClass(order.status) + '">' + formatStatus(order.status) + '</span>' +
                '</div>' +
                '<div class="order-history-items">' +
                '<h4>Items</h4>' +
                itemsHtml +
                '<div class="order-item-row total-row"><span>Total</span><span><strong>KSH ' + total.toLocaleString() + '</strong></span></div>' +
                '</div>' +
                (mapSection ? mapSection : '') +
                '<div class="order-history-actions">' +
                trackBtn +
                '</div>';
            container.appendChild(card);
        });
    }

    function initOrderHistory() {
        var user = getCurrentUser();
        var content = document.getElementById('orderHistoryContent');
        var loginPrompt = document.getElementById('orderHistoryLoginPrompt');
        var listEl = document.getElementById('orderHistoryList');

        if (!listEl) return;

        if (!user || !user.email) {
            if (content) content.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
            return;
        }

        if (content) content.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';

        var allOrders = getOrders();
        var userEmail = (user.email || '').toLowerCase().trim();
        var myOrders = allOrders.filter(function (o) {
            return (o.email || '').toLowerCase().trim() === userEmail;
        });
        myOrders.sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        renderOrders(myOrders, listEl);
    }

    window.initOrderHistory = initOrderHistory;
})();
