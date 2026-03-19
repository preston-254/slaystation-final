// Automatic Delivery Fee Calculator
// Shop Location: Westlands Market, Shop B15, Nairobi

const SHOP_LOCATION = {
    name: 'Slay Station - Westlands Market, Shop B15',
    address: 'Westlands Market, Shop B15, Nairobi, Kenya',
    lat: -1.2654,  // Westlands Market approximate coordinates
    lng: 36.8067
};

// Delivery fee structure based on distance (within Nairobi)
const DELIVERY_FEE_STRUCTURE = {
    baseFee: 150,  // Base delivery fee
    perKmRate: 40,  // Additional fee per kilometer (KSH 40 per km within Nairobi)
    maxFee: 1000,   // Maximum delivery fee
    minFee: 150     // Minimum delivery fee
};

// Nairobi boundaries (approximate)
const NAIROBI_BOUNDARIES = {
    minLat: -1.45,  // Southern boundary
    maxLat: -1.15,  // Northern boundary
    minLng: 36.65,  // Western boundary
    maxLng: 36.95   // Eastern boundary
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
}

// Check if location is within Nairobi boundaries
function isWithinNairobi(lat, lng) {
    if (!lat || !lng) return false;
    
    return lat >= NAIROBI_BOUNDARIES.minLat && 
           lat <= NAIROBI_BOUNDARIES.maxLat &&
           lng >= NAIROBI_BOUNDARIES.minLng && 
           lng <= NAIROBI_BOUNDARIES.maxLng;
}

// Check if address string indicates it's outside Nairobi/Country
function isOutsideNairobiOrCountry(address, location) {
    if (!address) return false;
    
    const addressLower = address.toLowerCase();
    
    // Check for indicators of being outside Nairobi
    const outsideNairobiIndicators = [
        'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'nanyuki',
        'malindi', 'lamu', 'kakamega', 'kisii', 'kericho', 'kitale',
        'garissa', 'machakos', 'meru', 'nyeri', 'embu', 'muranga',
        'kiambu', 'machakos', 'kajiado', 'narok', 'bomet', 'baringo',
        'laikipia', 'nyandarua', 'kirinyaga', 'nyeri', 'muranga',
        'uganda', 'tanzania', 'rwanda', 'ethiopia', 'somalia', 'sudan',
        'south sudan', 'burundi', 'international', 'outside kenya'
    ];
    
    // Check address string
    for (const indicator of outsideNairobiIndicators) {
        if (addressLower.includes(indicator)) {
            return true;
        }
    }
    
    // Check coordinates if location is provided
    if (location && location.lat && location.lng) {
        return !isWithinNairobi(location.lat, location.lng);
    }
    
    return false;
}

// Calculate delivery fee based on distance (only for within Nairobi)
function calculateDeliveryFee(distance) {
    if (!distance || distance <= 0) {
        return DELIVERY_FEE_STRUCTURE.baseFee;
    }
    
    // Calculate fee: base fee + (distance * per km rate)
    // KSH 40 per kilometer within Nairobi
    let fee = DELIVERY_FEE_STRUCTURE.baseFee + (distance * DELIVERY_FEE_STRUCTURE.perKmRate);
    
    // Round to nearest 50
    fee = Math.round(fee / 50) * 50;
    
    // Apply min/max limits
    fee = Math.max(fee, DELIVERY_FEE_STRUCTURE.minFee);
    fee = Math.min(fee, DELIVERY_FEE_STRUCTURE.maxFee);
    
    return fee;
}

// Geocode address to get coordinates
function geocodeAddress(address, callback) {
    // Use Nominatim (OpenStreetMap) geocoding
    if (typeof L !== 'undefined' && L.Control && L.Control.Geocoder) {
        const geocoder = L.Control.Geocoder.nominatim();
        
        // Add "Nairobi, Kenya" if not present
        const searchQuery = address.includes('Nairobi') || address.includes('Kenya') 
            ? address 
            : `${address}, Nairobi, Kenya`;
        
        geocoder.geocode(searchQuery, (results) => {
            if (results && results.length > 0) {
                const location = results[0].center;
                callback({
                    lat: location.lat,
                    lng: location.lng,
                    address: results[0].name || address
                });
            } else {
                // Fallback: use default location or return null
                callback(null);
            }
        }, (error) => {
            console.error('Geocoding error:', error);
            callback(null);
        });
    } else {
        // Fallback: try using fetch API
        const searchQuery = encodeURIComponent(
            address.includes('Nairobi') || address.includes('Kenya') 
                ? address 
                : `${address}, Nairobi, Kenya`
        );
        
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    callback({
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon),
                        address: data[0].display_name || address
                    });
                } else {
                    callback(null);
                }
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                callback(null);
            });
    }
}

// Auto-calculate delivery fee for an order
function autoCalculateDeliveryFee(deliveryAddress, callback) {
    if (!deliveryAddress || !deliveryAddress.trim()) {
        // No address provided, admin will set manually
        callback({
            fee: null,
            distance: 0,
            calculated: false,
            withinNairobi: false,
            message: 'Address not provided. Admin will set delivery fee manually.'
        });
        return;
    }
    
    // Geocode the delivery address
    geocodeAddress(deliveryAddress, (location) => {
        if (!location) {
            // Geocoding failed, check if address string indicates outside Nairobi
            const isOutside = isOutsideNairobiOrCountry(deliveryAddress, null);
            
            if (isOutside) {
                callback({
                    fee: null,
                    distance: 0,
                    calculated: false,
                    withinNairobi: false,
                    outsideNairobi: true,
                    message: 'Address appears to be outside Nairobi. Admin will set delivery fee manually and notify you.'
                });
            } else {
                callback({
                    fee: null,
                    distance: 0,
                    calculated: false,
                    withinNairobi: false,
                    message: 'Could not find address location. Admin will set delivery fee manually.'
                });
            }
            return;
        }
        
        // Check if location is within Nairobi
        const withinNairobi = isWithinNairobi(location.lat, location.lng);
        const outsideNairobi = isOutsideNairobiOrCountry(deliveryAddress, location);
        
        if (!withinNairobi || outsideNairobi) {
            // Outside Nairobi - admin must set fee manually
            callback({
                fee: null,
                distance: 0,
                calculated: false,
                withinNairobi: false,
                outsideNairobi: true,
                shopLocation: SHOP_LOCATION,
                deliveryLocation: location,
                message: 'Address is outside Nairobi. Admin will set delivery fee manually and notify you when ready.'
            });
            return;
        }
        
        // Within Nairobi - calculate fee automatically
        // Calculate distance from shop to delivery location
        const distance = calculateDistance(
            SHOP_LOCATION.lat,
            SHOP_LOCATION.lng,
            location.lat,
            location.lng
        );
        
        // Calculate delivery fee (KSH 40 per km)
        const fee = calculateDeliveryFee(distance);
        
        callback({
            fee: fee,
            distance: distance.toFixed(2),
            calculated: true,
            withinNairobi: true,
            shopLocation: SHOP_LOCATION,
            deliveryLocation: location,
            message: `Calculated based on ${distance.toFixed(2)} km from Westlands Market (KSH 40 per km)`
        });
    });
}

// Calculate delivery fee from coordinates (e.g. when user pins on map)
function calculateDeliveryFeeFromCoords(lat, lng, callback) {
    if (lat == null || lng == null) {
        callback({ fee: null, distance: 0, calculated: false, withinNairobi: false, message: 'No location provided.' });
        return;
    }
    const withinNairobi = isWithinNairobi(lat, lng);
    if (!withinNairobi) {
        callback({
            fee: null,
            distance: 0,
            calculated: false,
            withinNairobi: false,
            outsideNairobi: true,
            shopLocation: SHOP_LOCATION,
            deliveryLocation: { lat, lng },
            message: 'Pinned location is outside Nairobi. Admin will set delivery fee and contact you.'
        });
        return;
    }
    const distance = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
    const fee = calculateDeliveryFee(distance);
    callback({
        fee: fee,
        distance: distance.toFixed(2),
        calculated: true,
        withinNairobi: true,
        shopLocation: SHOP_LOCATION,
        deliveryLocation: { lat, lng },
        message: `Calculated based on ${distance.toFixed(2)} km from Westlands Market (KSH 40 per km)`
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.SHOP_LOCATION = SHOP_LOCATION;
    window.DELIVERY_FEE_STRUCTURE = DELIVERY_FEE_STRUCTURE;
    window.NAIROBI_BOUNDARIES = NAIROBI_BOUNDARIES;
    window.calculateDistance = calculateDistance;
    window.calculateDeliveryFee = calculateDeliveryFee;
    window.geocodeAddress = geocodeAddress;
    window.isWithinNairobi = isWithinNairobi;
    window.isOutsideNairobiOrCountry = isOutsideNairobiOrCountry;
    window.autoCalculateDeliveryFee = autoCalculateDeliveryFee;
    window.calculateDeliveryFeeFromCoords = calculateDeliveryFeeFromCoords;
}

