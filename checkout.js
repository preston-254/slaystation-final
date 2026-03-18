(function() {
    'use strict';

    var cart = [];
    var checkoutMap = null;
    var checkoutMarker = null;
    var checkoutMapIsGoogle = false;
    var mapInitialized = false;
    var pinnedLocation = null;
    var calculatedDeliveryFee = null;
    var calculatedDistance = null;

    // Towns, cities, estates/apartments and landmarks by country (Kenya expanded)
    var LOCATIONS_BY_COUNTRY = {
        KE: [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Lamu', 'Nanyuki', 'Kakamega', 'Kisii', 'Kericho', 'Kitale', 'Garissa', 'Machakos', 'Meru', 'Nyeri', 'Embu', "Murang'a", 'Kiambu', 'Kajiado', 'Narok',
            'Westlands', 'Parklands', 'Karen', 'Rongai', 'Ruaka', 'Kilimani', 'Lavington', 'South B', 'South C', 'South B bypass', 'Hurlingham', 'Westlands Market', 'Eastleigh', 'Runda', 'Gigiri', 'Muthaiga', 'Kileleshwa', 'Upperhill', 'Industrial Area', 'Embakasi', 'Donholm', 'Umoja', 'Kayole', 'Ruiru', 'Kahawa', 'JKIA', 'Jomo Kenyatta International Airport', 'Kenyatta National Hospital', 'Sarit Centre', 'Village Market', 'Yaya Centre', 'Junction Mall', 'Westgate', 'Safari Park', 'Ngong Road', 'Waiyaki Way', 'Mombasa Road', 'Thika Road', 'Juja', 'Kiambu Town', 'Limuru', 'Naivasha', 'Narok Town', 'Kajiado Town', 'Kiserian', 'Ongata Rongai', 'Ngong', 'Kikuyu', 'Athi River', 'Syokimau', 'Kitengela', 'Machakos Town', 'Kitui', 'Voi', 'Diani', 'Nyali', 'Bamburi', 'Likoni', 'Ukunda', 'Watamu', 'Vipingo'
        ],
        TZ: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Tanga', 'Zanzibar', 'Morogoro', 'Tabora', 'Kigoma', 'Moshi', 'Bukoba', 'Stone Town', 'Mbagala', 'Oyster Bay', 'Masaki', 'Mikocheni'],
        UG: ['Kampala', 'Entebbe', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Fort Portal', 'Kasese', 'Masaka', 'Hoima', 'Arua', 'Kololo', 'Naguru', 'Ntinda', 'Kabalagala', 'Entebbe Airport'],
        RW: ['Kigali', 'Butare', 'Gisenyi', 'Gitarama', 'Ruhengeri', 'Byumba', 'Cyangugu', 'Kibuye', 'Gikongoro', 'Nyamirambo', 'Remera', 'Kimironko', 'Kicukiro'],
        BI: ['Bujumbura', 'Gitega', 'Ngozi', 'Bururi', 'Rutana', 'Makamba', 'Muyinga', 'Kayanza', 'Ruyigi'],
        SS: ['Juba', 'Malakal', 'Wau', 'Yambio', 'Rumbek', 'Bor', 'Aweil', 'Torit', 'Bentiu', 'Yei'],
        SO: ['Mogadishu', 'Hargeisa', 'Kismayo', 'Bosaso', 'Garowe', 'Baidoa', 'Beledweyne', 'Galkayo', 'Merca'],
        ET: ["Addis Ababa", "Dire Dawa", "Mek'ele", 'Gondar', 'Bahir Dar', 'Hawassa', 'Harar', 'Jimma', 'Bishoftu', 'Shashamane', 'Dessie', 'Jijiga', 'Bole', 'Bole Road', 'Bole International Airport'],
        DJ: ['Djibouti', 'Ali Sabieh', 'Tadjourah', 'Obock', 'Dikhil', 'Arta'],
        ER: ['Asmara', 'Keren', 'Massawa', 'Assab', 'Mendefera', 'Barentu', 'Teseney', 'Agordat']
    };

    function getLocationsForCountry(countryCode) {
        var list = LOCATIONS_BY_COUNTRY[countryCode] || [];
        return list.slice().sort();
    }

    function getSelectedCountryCode() {
        var sel = document.getElementById('coCountry');
        var code = (sel && sel.value) ? sel.value : 'KE';
        return code.toLowerCase();
    }

    var googleAutocompleteInstance = null;

    function pinSelectedPlaceOnMap(lat, lng, addressText) {
        var mapWrap = document.getElementById('checkoutMapWrap');
        var addressInput = document.getElementById('coAddress');
        var msgEl = document.getElementById('checkoutDeliveryMsg');
        if (!mapWrap || !addressInput || !msgEl) return;
        mapWrap.style.display = 'block';
        addressInput.style.display = 'none';
        addressInput.removeAttribute('required');
        addressInput.value = addressText || (lat.toFixed(5) + ', ' + lng.toFixed(5));
        pinnedLocation = { lat: lat, lng: lng };
        if (!mapInitialized || !checkoutMap || !checkoutMarker) {
            setTimeout(function() { initCheckoutMap(); }, 150);
        }
        setTimeout(function() {
            if (checkoutMap && checkoutMarker) {
                if (checkoutMapIsGoogle && checkoutMarker.setPosition) {
                    checkoutMarker.setPosition({ lat: lat, lng: lng });
                    checkoutMap.panTo({ lat: lat, lng: lng });
                    checkoutMap.setZoom(16);
                } else if (checkoutMarker.setLatLng) {
                    checkoutMarker.setLatLng([lat, lng]);
                    checkoutMap.setView([lat, lng], 16);
                }
                if (typeof window.calculateDeliveryFeeFromCoords === 'function') {
                    window.calculateDeliveryFeeFromCoords(lat, lng, function(result) {
                        if (msgEl) {
                            msgEl.style.display = 'block';
                            if (result && result.calculated && result.fee != null && result.withinNairobi) {
                                calculatedDeliveryFee = result.fee;
                                calculatedDistance = result.distance;
                                msgEl.innerHTML = '✓ Delivery fee: <strong>KSH ' + result.fee.toLocaleString() + '</strong>' + (result.distance ? ' (' + result.distance + ' km from Westlands Market)' : '');
                                msgEl.className = 'checkout-delivery-msg nairobi';
                            } else {
                                calculatedDeliveryFee = null;
                                calculatedDistance = null;
                                msgEl.textContent = result && result.outsideNairobi ? 'Location outside Nairobi. We will contact you for delivery fee.' : 'Location pinned on map.';
                                msgEl.className = 'checkout-delivery-msg ' + (result && result.outsideNairobi ? 'other' : 'nairobi');
                            }
                            renderSummary();
                        }
                    });
                } else if (typeof fallbackCalculateFeeFromCoords === 'function') {
                    fallbackCalculateFeeFromCoords(lat, lng, function(result) {
                        if (msgEl) {
                            msgEl.style.display = 'block';
                            if (result && result.calculated && result.fee != null && result.withinNairobi) {
                                calculatedDeliveryFee = result.fee;
                                calculatedDistance = result.distance;
                                msgEl.innerHTML = '✓ Delivery fee: <strong>KSH ' + result.fee.toLocaleString() + '</strong>';
                                msgEl.className = 'checkout-delivery-msg nairobi';
                            } else {
                                calculatedDeliveryFee = null;
                                calculatedDistance = null;
                                msgEl.className = 'checkout-delivery-msg other';
                                msgEl.textContent = result && result.outsideNairobi ? 'Outside Nairobi. We will contact you for delivery fee.' : 'Location pinned on map.';
                            }
                            renderSummary();
                        }
                    });
                } else {
                    if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = 'Location pinned on map.'; msgEl.className = 'checkout-delivery-msg nairobi'; }
                    renderSummary();
                }
            }
        }, mapInitialized ? 50 : 400);
    }

    function initGooglePlacesAutocomplete() {
        var input = document.getElementById('coLocation');
        var list = document.getElementById('coLocationSuggestions');
        var tip = document.getElementById('coLocationTip');
        if (!input || !window.google || !window.google.maps || !window.google.maps.places) return;
        if (list) list.style.display = 'none';
        if (tip) tip.style.display = 'none';
        var countryCode = getSelectedCountryCode();
        var options = {
            types: ['geocode'],
            fields: ['formatted_address', 'geometry', 'name']
        };
        if (countryCode && countryCode.length === 2) options.componentRestrictions = { country: countryCode };
        if (googleAutocompleteInstance) googleAutocompleteInstance = null;
        var autocomplete = new google.maps.places.Autocomplete(input, options);
        googleAutocompleteInstance = autocomplete;
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place || !place.geometry || !place.geometry.location) return;
            var lat = place.geometry.location.lat();
            var lng = place.geometry.location.lng();
            var addressText = place.formatted_address || place.name || (lat.toFixed(5) + ', ' + lng.toFixed(5));
            input.value = place.formatted_address || place.name || input.value;
            pinSelectedPlaceOnMap(lat, lng, addressText);
        });
    }

    function updateGooglePlacesCountry() {
        if (!googleAutocompleteInstance || !window.google || !window.google.maps) return;
        var countryCode = getSelectedCountryCode();
        if (countryCode && countryCode.length === 2) {
            try {
                googleAutocompleteInstance.setComponentRestrictions({ country: countryCode });
            } catch (e) {}
        }
    }

    function loadCart() {
        try {
            var saved = localStorage.getItem('slayStationCart');
            cart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            cart = [];
        }
        return cart;
    }

    window.removeFromCartCheckout = function(itemId, category) {
        cart = cart.filter(function(item) {
            return !(item.id === itemId && (item.category || 'bag') === (category || 'bag'));
        });
        localStorage.setItem('slayStationCart', JSON.stringify(cart));
        if (cart.length === 0) {
            document.getElementById('checkoutEmpty').style.display = 'block';
            document.getElementById('checkoutContent').style.display = 'none';
            return;
        }
        renderSummary();
    };

    function getSubtotal() {
        return cart.reduce(function(sum, item) {
            var p = typeof item.price === 'number' ? item.price : parseInt(item.price, 10) || 0;
            var q = item.quantity || 1;
            return sum + (p * q);
        }, 0);
    }

    function renderSummary() {
        var container = document.getElementById('checkoutSummaryItems');
        var subtotalEl = document.getElementById('checkoutSubtotal');
        var deliveryEl = document.getElementById('checkoutDeliveryFee');
        var totalEl = document.getElementById('checkoutTotal');
        if (!container) return;

        var subtotal = getSubtotal();
        var deliveryFee = calculatedDeliveryFee !== null ? calculatedDeliveryFee : 0;
        var total = subtotal + deliveryFee;

        var baseUrl = (typeof location !== 'undefined' && location.pathname) ? (function() {
            var path = location.pathname; var dir = path.replace(/\/[^/]*$/, '') || '/';
            if (!dir.endsWith('/')) dir += '/';
            return (location.origin || '') + dir;
        })() : '';
        function imgSrc(im) {
            if (!im || typeof im !== 'string') return '';
            if (im.indexOf('http') === 0 || im.indexOf('data:') === 0) return im;
            return baseUrl + (im.charAt(0) === '/' ? im.slice(1) : im);
        }
        container.innerHTML = cart.map(function(item) {
            var price = typeof item.price === 'number' ? item.price : parseInt(item.price, 10) || 0;
            var qty = item.quantity || 1;
            var img = item.image ? imgSrc(item.image) : (baseUrl + 'images/bags/img_1328.jpg');
            var cat = (item.category || 'bag');
            var name = (item.name || 'Item').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return '<div class="checkout-summary-item cart-item">' +
                '<div class="cart-item-image"><img src="' + img + '" alt="' + name + '" onerror="this.onerror=null; this.style.display=\'none\'; this.parentElement.innerHTML=\'🛍\';"></div>' +
                '<div class="cart-item-details">' +
                '<div class="cart-item-name">' + name + '</div>' +
                '<div class="cart-item-price">KSH ' + (price * qty).toLocaleString() + ' × ' + qty + '</div>' +
                '<button type="button" class="remove-from-cart-btn" data-id="' + item.id + '" data-category="' + cat + '">Remove</button>' +
                '</div></div>';
        }).join('');
        container.querySelectorAll('.remove-from-cart-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(btn.getAttribute('data-id'), 10);
                var cat = btn.getAttribute('data-category') || 'bag';
                window.removeFromCartCheckout(id, cat);
            });
        });

        subtotalEl.textContent = 'KSH ' + subtotal.toLocaleString();
        if (calculatedDeliveryFee !== null) {
            deliveryEl.textContent = 'KSH ' + calculatedDeliveryFee.toLocaleString();
        } else {
            deliveryEl.textContent = 'Pin location for fee';
        }
        totalEl.textContent = 'KSH ' + total.toLocaleString();
        if (typeof updateMpesaTotal === 'function') updateMpesaTotal();
    }

    function onCountryChange() {
        var country = document.getElementById('coCountry').value;
        var countySelect = document.getElementById('coCounty');
        if (!countySelect) return;
        countySelect.innerHTML = '<option value="">Select county/city</option>';
        var cities = EAST_AFRICA_CITIES[country];
        if (cities && cities.length) {
            cities.forEach(function(city) {
                var opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                countySelect.appendChild(opt);
            });
        }
        document.getElementById('checkoutMapWrap').style.display = 'none';
        document.getElementById('coAddress').style.display = 'block';
        document.getElementById('checkoutDeliveryMsg').style.display = 'none';
        calculatedDeliveryFee = null;
        calculatedDistance = null;
        renderSummary();
    }

    function onCountyChange() {
        var county = document.getElementById('coCounty').value;
        var mapWrap = document.getElementById('checkoutMapWrap');
        var addressInput = document.getElementById('coAddress');
        var msgEl = document.getElementById('checkoutDeliveryMsg');

        if (county === 'Nairobi') {
            mapWrap.style.display = 'block';
            addressInput.style.display = 'none';
            addressInput.removeAttribute('required');
            msgEl.style.display = 'block';
            msgEl.className = 'checkout-delivery-msg nairobi';
            msgEl.textContent = 'Pin your exact delivery location on the map. Delivery fee is calculated from Westlands Market.';
            if (!mapInitialized) {
                setTimeout(function() { initCheckoutMap(); }, 150);
            }
        } else {
            mapWrap.style.display = 'none';
            addressInput.style.display = 'block';
            addressInput.setAttribute('required', 'required');
            calculatedDeliveryFee = null;
            calculatedDistance = null;
            if (county) {
                msgEl.style.display = 'block';
                msgEl.className = 'checkout-delivery-msg other';
                msgEl.textContent = 'For this county/city you will be contacted to pay the delivery fee. We will get in touch after you place your order.';
            } else {
                msgEl.style.display = 'none';
            }
        }
        renderSummary();
    }

    function getMarkerLatLng() {
        if (!checkoutMarker) return null;
        if (checkoutMarker.getPosition) {
            var pos = checkoutMarker.getPosition();
            return pos ? { lat: pos.lat(), lng: pos.lng() } : null;
        }
        if (checkoutMarker.getLatLng) {
            var ll = checkoutMarker.getLatLng();
            return ll ? { lat: ll.lat, lng: ll.lng } : null;
        }
        return null;
    }

    function initCheckoutMap() {
        var mapEl = document.getElementById('checkoutMapPicker');
        if (!mapEl) return;
        if (window.SLAYSTATION_GOOGLE_MAPS_KEY && !window.google && !mapInitialized) {
            setTimeout(function() { if (!mapInitialized) initCheckoutMap(); }, 1500);
            return;
        }
        var msgEl = document.getElementById('checkoutDeliveryMsg');
        var centerLat = -1.2654;
        var centerLng = 36.8067;

        function updateFromMarker() {
            var ll = getMarkerLatLng();
            if (!ll) return;
            var lat = ll.lat;
            var lng = ll.lng;
            pinnedLocation = { lat: lat, lng: lng };
            var addr = lat.toFixed(5) + ', ' + lng.toFixed(5) + ', Nairobi, Kenya';
            var coAddress = document.getElementById('coAddress');
            if (coAddress) coAddress.value = addr;

            function applyFeeResult(result) {
                if (msgEl) msgEl.style.display = 'block';
                if (result && result.calculated && result.fee != null && result.withinNairobi) {
                    calculatedDeliveryFee = result.fee;
                    calculatedDistance = result.distance;
                    if (msgEl) {
                        msgEl.innerHTML = '✓ Delivery fee: <strong>KSH ' + result.fee.toLocaleString() + '</strong>' + (result.distance ? ' (' + result.distance + ' km from Westlands Market)' : '');
                        msgEl.className = 'checkout-delivery-msg nairobi';
                    }
                } else {
                    calculatedDeliveryFee = null;
                    calculatedDistance = null;
                    if (msgEl) {
                        msgEl.textContent = result && result.outsideNairobi ? 'Location outside Nairobi. We will contact you for delivery fee.' : 'Pin your exact delivery location on the map.';
                        msgEl.className = 'checkout-delivery-msg ' + (result && result.outsideNairobi ? 'other' : 'nairobi');
                    }
                }
                renderSummary();
            }
            if (typeof window.calculateDeliveryFeeFromCoords === 'function') {
                window.calculateDeliveryFeeFromCoords(lat, lng, applyFeeResult);
            } else if (typeof fallbackCalculateFeeFromCoords === 'function') {
                fallbackCalculateFeeFromCoords(lat, lng, applyFeeResult);
            }
        }

        if (window.google && window.google.maps) {
            checkoutMapIsGoogle = true;
            checkoutMap = new google.maps.Map(mapEl, {
                center: { lat: centerLat, lng: centerLng },
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true
            });
            new google.maps.Marker({
                position: { lat: centerLat, lng: centerLng },
                map: checkoutMap,
                title: 'Slay Station – Westlands Market, Shop B15, Nairobi',
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, labelOrigin: new google.maps.Point(0, -10) },
                label: { text: '🏪', fontSize: '24px' }
            });
            checkoutMarker = new google.maps.Marker({
                position: { lat: centerLat, lng: centerLng },
                map: checkoutMap,
                draggable: true,
                title: 'Your delivery location – drag or click map'
            });
            google.maps.event.addListener(checkoutMap, 'click', function(e) {
                checkoutMarker.setPosition(e.latLng);
                updateFromMarker();
            });
            google.maps.event.addListener(checkoutMarker, 'dragend', updateFromMarker);
            updateFromMarker();
        } else if (window.L) {
            checkoutMapIsGoogle = false;
            var center = [centerLat, centerLng];
            checkoutMap = L.map('checkoutMapPicker', { center: center, zoom: 13 });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(checkoutMap);
            var shopIcon = L.divIcon({
                className: 'map-shop-pin',
                html: '<span style="font-size:24px;line-height:1;" aria-hidden="true">🏪</span>',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });
            L.marker(center, { icon: shopIcon, draggable: false }).addTo(checkoutMap).bindPopup('<strong>Slay Station</strong><br>Westlands Market, Shop B15, Nairobi');
            checkoutMarker = L.marker(center, { draggable: true }).addTo(checkoutMap);
            checkoutMarker.bindPopup('Click map or drag marker. Fee updates automatically.').openPopup();
            checkoutMap.on('click', function(e) {
                checkoutMarker.setLatLng(e.latlng);
                updateFromMarker();
            });
            checkoutMarker.on('dragend', updateFromMarker);
            updateFromMarker();
            setTimeout(function() {
                if (checkoutMap && checkoutMap.invalidateSize) checkoutMap.invalidateSize();
            }, 200);
        } else {
            return;
        }
        mapInitialized = true;
    }

    function setupPaymentToggle() {
        var options = document.querySelectorAll('.payment-option');
        var cardFields = document.getElementById('cardFields');
        function updatePaymentUI(value) {
            options.forEach(function(o) { o.classList.remove('selected'); });
            var opt = Array.prototype.find.call(options, function(o) { return o.querySelector('input').value === value; });
            if (opt) opt.classList.add('selected');
            if (cardFields) cardFields.style.display = value === 'card' ? 'block' : 'none';
        }
        options.forEach(function(opt) {
            opt.addEventListener('click', function() {
                var value = opt.querySelector('input').value;
                updatePaymentUI(value);
            });
        });
        updatePaymentUI(document.querySelector('input[name="payment"]:checked') && document.querySelector('input[name="payment"]:checked').value || 'mpesa');
    }

    function getAddressForOrder() {
        var mapWrap = document.getElementById('checkoutMapWrap');
        if (mapWrap && mapWrap.style && mapWrap.style.display !== 'none') {
            var addr = document.getElementById('coAddress');
            return (addr && addr.value) ? addr.value.trim() : (pinnedLocation ? pinnedLocation.lat + ', ' + pinnedLocation.lng + ', Nairobi, Kenya' : '');
        }
        var addr = document.getElementById('coAddress');
        return addr ? addr.value.trim() : '';
    }

    function placeOrder() {
        var name = (document.getElementById('coName') && document.getElementById('coName').value || '').trim();
        var email = (document.getElementById('coEmail') && document.getElementById('coEmail').value || '').trim();
        var phone = (document.getElementById('coPhone') && document.getElementById('coPhone').value || '').trim();
        var countryEl = document.getElementById('coCountry');
        var country = (countryEl && countryEl.value) ? countryEl.value : 'KE';
        var locationText = (document.getElementById('coLocation') && document.getElementById('coLocation').value || '').trim();
        var address = getAddressForOrder();
        var payment = document.querySelector('input[name="payment"]:checked') && document.querySelector('input[name="payment"]:checked').value;
        var county = locationText || 'Nairobi';

        if (!name || !email || !phone || !locationText) {
            alert('Please fill in all required fields (name, email, phone, country, location).');
            return;
        }
        if (!address && county === 'Nairobi') {
            alert('Pin your delivery location on the map for Nairobi, or enter your address.');
            return;
        }
        if (!address && county !== 'Nairobi') {
            address = locationText;
        }

        var subtotal = getSubtotal();
        var deliveryFee = calculatedDeliveryFee !== null ? calculatedDeliveryFee : 0;
        var total = subtotal + deliveryFee;

        var orderData = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            location: locationText,
            orderCountry: country,
            orderCounty: county,
            payment: payment,
            items: cart.map(function(i) { return { id: i.id, name: i.name, price: i.price, quantity: i.quantity || 1, image: i.image }; }),
            giftWrap: false,
            subtotal: subtotal,
            total: payment === 'card' ? total : total,
            deliveryFee: deliveryFee,
            deliveryFeeAutoCalculated: calculatedDeliveryFee !== null,
            deliveryDistance: calculatedDistance,
            withinNairobi: county === 'Nairobi' && calculatedDeliveryFee !== null,
            pinnedLocation: pinnedLocation,
            paymentStatus: 'pending',
            deliveryFeePaid: false,
            itemsPaid: false,
        };

        var order;
        if (typeof window.createOrder === 'function') {
            order = window.createOrder(orderData);
            if (order && !order.mpesaReference) {
                order.mpesaReference = 'SLY' + order.id + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
                var orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
                var idx = orders.findIndex(function(o) { return o.id === order.id; });
                if (idx !== -1) { orders[idx] = order; localStorage.setItem('slayStationOrders', JSON.stringify(orders)); }
            }
        } else {
            var orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            var orderId = orders.length ? Math.max.apply(null, orders.map(function(o) { return o.id; })) + 1 : 1;
            order = {
                id: orderId,
                date: new Date().toISOString(),
                status: 'pending',
                deliveryFeeSet: deliveryFee != null,
                deliveryFeeNotificationSent: false,
                notifications: [],
                itemsPaid: false,
                itemsPaymentMethod: null,
                deliveryFeePaid: false
            };
            for (var k in orderData) order[k] = orderData[k];
            order.mpesaReference = 'SLY' + order.id + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
            orders.push(order);
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }

        cart = [];
        localStorage.setItem('slayStationCart', JSON.stringify([]));

        if (typeof window.showOrderSuccessWithMpesa === 'function') {
            window.showOrderSuccessWithMpesa(order);
        } else {
            var msg = 'Order #' + order.id + ' placed successfully. ';
            if (county !== 'Nairobi' && !deliveryFee) msg += 'You will be contacted to pay the delivery fee.';
            else if (deliveryFee) msg += 'Delivery fee: KSH ' + deliveryFee.toLocaleString() + '.';
            alert(msg + '\n\nRedirecting to track your order.');
            window.location.href = 'track-order.html?order=' + order.id;
        }
    }

    function initStaticLocationAutocomplete() {
        var input = document.getElementById('coLocation');
        var list = document.getElementById('coLocationSuggestions');
        var tip = document.getElementById('coLocationTip');
        if (!input || !list) return;
        if (tip) tip.style.display = 'block';
        var hideTimeout = null;
        function getSelectedCountry() {
            var sel = document.getElementById('coCountry');
            return (sel && sel.value) ? sel.value : 'KE';
        }
        function applySelectedLocation(loc, isCustom) {
            input.value = loc;
            list.style.display = 'none';
            list.innerHTML = '';
            var mapWrap = document.getElementById('checkoutMapWrap');
            var addressInput = document.getElementById('coAddress');
            var msgEl = document.getElementById('checkoutDeliveryMsg');
            if (loc === 'Nairobi' && mapWrap && addressInput && msgEl) {
                mapWrap.style.display = 'block';
                addressInput.style.display = 'none';
                addressInput.removeAttribute('required');
                msgEl.style.display = 'block';
                msgEl.className = 'checkout-delivery-msg nairobi';
                msgEl.textContent = 'Pin your exact delivery location on the map. Delivery fee is calculated from Westlands Market.';
                if (!mapInitialized) setTimeout(function() { initCheckoutMap(); }, 150);
            } else if (mapWrap && addressInput && msgEl) {
                mapWrap.style.display = 'none';
                addressInput.style.display = 'block';
                addressInput.setAttribute('required', 'required');
                if (isCustom) addressInput.value = loc;
                msgEl.style.display = 'block';
                msgEl.className = 'checkout-delivery-msg other';
                msgEl.textContent = 'For this area you will be contacted to pay the delivery fee. We will get in touch after you place your order.';
                calculatedDeliveryFee = null;
                calculatedDistance = null;
                renderSummary();
            }
        }
        function showSuggestions(query) {
            var rawQuery = (input && input.value) ? input.value.trim() : '';
            query = (query || rawQuery || '').trim().toLowerCase();
            list.innerHTML = '';
            if (!query) {
                list.style.display = 'none';
                return;
            }
            var locations = getLocationsForCountry(getSelectedCountry());
            var matches = locations.filter(function(loc) {
                return loc.toLowerCase().indexOf(query) !== -1;
            });
            if (matches.length === 0) {
                var displayText = rawQuery || query;
                list.innerHTML = '<div class="location-suggestion location-suggestion-tip" style="color:#666;font-size:0.85rem;padding:8px 12px;">No match in list. Select below to use your text as location, or add a Google Maps API key for full address search.</div>' +
                    '<div class="location-suggestion location-suggestion-use-custom" role="option" style="font-weight:600;">Use "' + displayText + '" as my location</div>';
                list.style.display = 'block';
                var useCustom = list.querySelector('.location-suggestion-use-custom');
                if (useCustom) useCustom.addEventListener('click', function() {
                    applySelectedLocation(rawQuery || query, true);
                });
                return;
            }
            matches.slice(0, 12).forEach(function(loc) {
                var div = document.createElement('div');
                div.className = 'location-suggestion';
                div.setAttribute('role', 'option');
                div.textContent = loc;
                div.addEventListener('click', function() {
                    applySelectedLocation(loc, false);
                });
                list.appendChild(div);
            });
            list.style.display = 'block';
        }
        function hideSoon() {
            hideTimeout = setTimeout(function() {
                list.style.display = 'none';
                list.innerHTML = '';
            }, 200);
        }
        input.addEventListener('input', function() {
            if (hideTimeout) clearTimeout(hideTimeout);
            showSuggestions(input.value);
        });
        input.addEventListener('focus', function() {
            if (hideTimeout) clearTimeout(hideTimeout);
            showSuggestions(input.value);
        });
        input.addEventListener('blur', hideSoon);
        list.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });
    }

    function setupCountryChangeForLocation() {
        var countrySel = document.getElementById('coCountry');
        if (!countrySel) return;
        countrySel.addEventListener('change', function() {
            var locInput = document.getElementById('coLocation');
            if (locInput) {
                locInput.value = getSelectedCountryCode() === 'ke' ? 'Nairobi' : '';
                locInput.placeholder = 'Start typing to search (Google) or pick from list';
            }
            var listEl = document.getElementById('coLocationSuggestions');
            if (listEl) { listEl.style.display = 'none'; listEl.innerHTML = ''; }
            updateGooglePlacesCountry();
            var mapWrap = document.getElementById('checkoutMapWrap');
            var addressInput = document.getElementById('coAddress');
            var msgEl = document.getElementById('checkoutDeliveryMsg');
            if (getSelectedCountryCode() === 'ke' && mapWrap && addressInput && msgEl) {
                mapWrap.style.display = 'block';
                addressInput.style.display = 'none';
                addressInput.removeAttribute('required');
                msgEl.style.display = 'block';
                msgEl.className = 'checkout-delivery-msg nairobi';
                msgEl.textContent = 'Search for your location above or pin on the map. Delivery fee is calculated from Westlands Market.';
                if (!mapInitialized) setTimeout(function() { initCheckoutMap(); }, 150);
            } else if (mapWrap && addressInput && msgEl) {
                mapWrap.style.display = 'none';
                addressInput.style.display = 'block';
                addressInput.setAttribute('required', 'required');
                msgEl.style.display = 'block';
                msgEl.className = 'checkout-delivery-msg other';
                msgEl.textContent = 'For this area you will be contacted to pay the delivery fee. We will get in touch after you place your order.';
                calculatedDeliveryFee = null;
                calculatedDistance = null;
                renderSummary();
            }
        });
    }

    function initLocationAutocomplete() {
        if (window.slayStationMapsReady && window.google && window.google.maps && window.google.maps.places) {
            initGooglePlacesAutocomplete();
        } else {
            initStaticLocationAutocomplete();
            window.onSlayStationMapsReady = function() {
                if (window.slayStationMapsFailed || !window.google || !window.google.maps || !window.google.maps.places) {
                    initStaticLocationAutocomplete();
                } else {
                    initGooglePlacesAutocomplete();
                }
            };
        }
        setupCountryChangeForLocation();
    }

    var MPESA_TILL = '3193269';
    function showOrderSuccessWithMpesa(order) {
        var ref = order.mpesaReference || ('SLY' + order.id + '-' + Math.random().toString(36).substr(2, 4).toUpperCase());
        if (!order.mpesaReference) {
            order.mpesaReference = ref;
            var orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            var idx = orders.findIndex(function(o) { return o.id === order.id; });
            if (idx !== -1) { orders[idx] = order; localStorage.setItem('slayStationOrders', JSON.stringify(orders)); }
        }
        var total = order.total || (order.subtotal + (order.deliveryFee || 0));
        var orderMessage = 'Order #' + order.id + ' | ' + (order.name || '') + ' | KSH ' + (total || 0).toLocaleString() + ' | Ref: ' + ref;
        var modal = document.createElement('div');
        modal.id = 'orderSuccessMpesaModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
        modal.innerHTML =
            '<div style="background:#fff;border-radius:16px;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">' +
            '<div style="padding:1.5rem;">' +
            '<h2 style="margin:0 0 0.5rem 0;font-size:1.5rem;">Order Successful</h2>' +
            '<div style="background:linear-gradient(135deg,#ffebee,#fce4ec);border:2px solid #e91e63;border-radius:10px;padding:0.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">' +
            '<span style="color:#c2185b;font-weight:600;font-size:0.9rem;">Your order is currently unpaid. Please pay via M-Pesa or contact us.</span>' +
            '</div>' +
            '<div style="text-align:center;margin:1rem 0;">' +
            '<div style="width:64px;height:64px;margin:0 auto 0.5rem;background:#4caf50;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;">✓</div>' +
            '<p style="margin:0;font-weight:600;">Thank you for your order!</p>' +
            '<p style="margin:0.25rem 0 0;color:#666;font-size:0.9rem;">Your order has been received. We\'ll process it shortly.</p>' +
            '</div>' +
            '<div style="background:#e8f5e9;padding:0.75rem;border-radius:10px;margin-bottom:1rem;font-size:0.9rem;">It typically takes about 2 hours to process. We\'ll notify you when it\'s ready.</div>' +
            '<p style="margin:0 0 0.25rem 0;font-size:0.85rem;color:#666;">Delivery to:</p>' +
            '<p style="margin:0 0 1rem 0;font-weight:600;">' + (order.name || '') + ' · ' + (order.address || order.location || '') + '</p>' +
            '<div style="background:#f5f5f5;padding:1rem;border-radius:10px;margin-bottom:1rem;">' +
            '<p style="margin:0 0 0.5rem 0;font-weight:600;font-size:0.9rem;">Pay via M-Pesa</p>' +
            '<p style="margin:0 0 0.25rem 0;font-size:0.85rem;">Till number: <strong>' + MPESA_TILL + '</strong></p>' +
            '<p style="margin:0 0 0.5rem 0;font-size:0.85rem;">Use this unique reference when paying: <strong style="font-family:monospace;background:#fff;padding:0.2rem 0.4rem;border-radius:4px;">' + ref + '</strong></p>' +
            '<label style="display:block;margin:0.5rem 0 0.25rem 0;font-size:0.85rem;">Paste M-Pesa message / code</label>' +
            '<input type="text" id="orderSuccessMpesaCode" placeholder="e.g. ABC123XY or code from M-Pesa message" style="width:100%;padding:0.6rem;border:2px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:0.25rem;">' +
            '<button type="button" id="orderSuccessSubmitCode" style="margin-top:0.5rem;width:100%;padding:0.6rem;background:#2196f3;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Submit M-Pesa code</button>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:0.5rem;">' +
            '<button type="button" class="order-success-copy" style="padding:0.6rem;background:#f5f5f5;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-weight:600;">Copy order message</button>' +
            '<button type="button" class="order-success-close" style="padding:0.6rem;background:#fff;border:2px solid #333;border-radius:8px;cursor:pointer;font-weight:600;">Close</button>' +
            '<a href="#" class="order-success-whatsapp" style="display:block;text-align:center;padding:0.6rem;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Send to WhatsApp</a>' +
            '</div>' +
            '</div></div>';
        document.body.appendChild(modal);
        var codeInput = document.getElementById('orderSuccessMpesaCode');
        var submitBtn = document.getElementById('orderSuccessSubmitCode');
        function closeModal() {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
            if (typeof window.location !== 'undefined') window.location.href = 'track-order.html?order=' + order.id;
        }
        modal.querySelector('.order-success-copy').onclick = function() {
            try {
                navigator.clipboard.writeText(orderMessage);
                alert('Order message copied to clipboard.');
            } catch (e) { prompt('Copy this:', orderMessage); }
        };
        modal.querySelector('.order-success-close').onclick = closeModal;
        var waNum = '254794594595';
        var waText = encodeURIComponent('Hi, I just placed Order #' + order.id + '. Ref: ' + ref + '. Total: KSH ' + (total || 0).toLocaleString() + '.');
        modal.querySelector('.order-success-whatsapp').href = 'https://wa.me/' + waNum + '?text=' + waText;
        modal.querySelector('.order-success-whatsapp').onclick = function(e) { e.preventDefault(); window.open(this.href, '_blank'); };
        submitBtn.onclick = function() {
            var code = (codeInput && codeInput.value) ? codeInput.value.trim() : '';
            if (!code) { alert('Please enter your M-Pesa code.'); return; }
            var orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            var o = orders.find(function(x) { return x.id === order.id; });
            if (o) {
                o.mpesaCode = code;
                o.mpesaCodeSubmittedTime = new Date().toISOString();
                o.payment = o.payment || 'mpesa';
                var i = orders.indexOf(o);
                if (i !== -1) orders[i] = o;
                localStorage.setItem('slayStationOrders', JSON.stringify(orders));
            }
            submitBtn.textContent = 'Code submitted!';
            submitBtn.disabled = true;
            if (codeInput) codeInput.disabled = true;
            setTimeout(closeModal, 1500);
        };
    }
    window.showOrderSuccessWithMpesa = showOrderSuccessWithMpesa;

    function init() {
        loadCart();
        if (cart.length === 0) {
            document.getElementById('checkoutEmpty').style.display = 'block';
            document.getElementById('checkoutContent').style.display = 'none';
            return;
        }

        setupPaymentToggle();
        initLocationAutocomplete();
        var coCountryEl = document.getElementById('coCountry');
        var coLocationEl = document.getElementById('coLocation');
        if (coLocationEl && !coLocationEl.value && (!coCountryEl || coCountryEl.value === 'KE')) coLocationEl.value = 'Nairobi';
        renderSummary();
        var mapWrap = document.getElementById('checkoutMapWrap');
        if (mapWrap && mapWrap.style) mapWrap.style.display = 'block';
        if (!mapInitialized) setTimeout(function() { initCheckoutMap(); }, 150);

        var btn = document.getElementById('btnPlaceOrder');
        if (btn) btn.addEventListener('click', placeOrder);

        var user = null;
        try {
            var u = localStorage.getItem('slayStationCurrentUser');
            if (u) user = JSON.parse(u);
        } catch (e) {}
        if (user) {
            var nameEl = document.getElementById('coName');
            var emailEl = document.getElementById('coEmail');
            var phoneEl = document.getElementById('coPhone');
            if (nameEl) nameEl.value = user.name || '';
            if (emailEl) emailEl.value = user.email || '';
            if (phoneEl) phoneEl.value = user.phone || '';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
