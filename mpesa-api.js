/**
 * M-Pesa Daraja API Integration
 * 
 * To use this integration, you need to:
 * 1. Register at https://developer.safaricom.co.ke/
 * 2. Create an app to get Consumer Key and Consumer Secret
 * 3. Get your Passkey from Safaricom
 * 4. Update the credentials below
 * 
 * IMPORTANT: Never commit these credentials to version control!
 * Use environment variables or a secure config file in production.
 */

// M-Pesa API Configuration
const MPESA_CONFIG = {
    // Get these from Safaricom Daraja Developer Portal: https://developer.safaricom.co.ke/
    CONSUMER_KEY: 'OzG1aZpvAiyCvKnzFvj1EzjO7W05d11LdBIeOlzmBRq7HNbI',        // From Daraja Developer Portal
    CONSUMER_SECRET: 'rtu6fziXm62cV5OjjA7R59lM4LcvaLT7mQSbgRR0WB6sYMtwzWZOwsVAGJLPgbUL',  // From Daraja Developer Portal
    PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',                  // From Safaricom (for STK Push)
    
    
    // API Endpoints
    BASE_URL: 'https://api.safaricom.co.ke',   // Production API
    AUTH_URL: '/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: '/mpesa/stkpush/v1/processrequest',
    QUERY_URL: '/mpesa/stkpushquery/v1/query',
    
    // Production Business Short Code
    BUSINESS_SHORT_CODE: '516600',                 // Production Business Short Code
    ACCOUNT_REFERENCE: '944444',                   // Your account reference
    
    // Backend Server URL (Update this after deploying backend to Render)
    // Example: https://slaystation-mpesa-backend.onrender.com
    // IMPORTANT: Update this with your actual Render backend URL after deployment!
    BACKEND_URL: 'https://slaystation-mpesa-backend.onrender.com',
    
    // Callback URLs (will be set by backend)
    CALLBACK_URL: 'https://slay-station-28453.firebaseapp.com/api/mpesa/callback',  // Your callback URL
    TIMEOUT_URL: 'https://slay-station-28453.firebaseapp.com/api/mpesa/timeout',    // Your timeout URL
};

/**
 * Get OAuth Access Token from M-Pesa API
 * @returns {Promise<string>} Access token
 */
async function getMpesaAccessToken() {
    try {
        const auth = btoa(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`);
        const url = `${MPESA_CONFIG.BASE_URL}${MPESA_CONFIG.AUTH_URL}`;
        
        console.log('🔐 Requesting M-Pesa OAuth token...');
        console.log('📍 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to get access token: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage += ` - ${errorData.error_description || errorData.error || errorText}`;
            } catch (e) {
                errorMessage += ` - ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!data.access_token) {
            throw new Error('No access token in response: ' + JSON.stringify(data));
        }
        
        console.log('✅ OAuth token received successfully!');
        return data.access_token;
    } catch (error) {
        console.error('❌ Error getting M-Pesa access token:', error);
        
        // Check if it's a CORS error
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            console.warn('⚠️ CORS Error: M-Pesa API may not allow direct browser calls.');
            console.warn('💡 Consider using a backend proxy server to avoid CORS issues.');
        }
        
        throw error;
    }
}

/**
 * Generate password for STK Push (Base64 encoded)
 * @param {string} timestamp - Current timestamp
 * @returns {string} Encoded password
 */
function generatePassword(timestamp) {
    const password = `${MPESA_CONFIG.BUSINESS_SHORT_CODE}${MPESA_CONFIG.PASSKEY}${timestamp}`;
    return btoa(password);
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 * @returns {string} Timestamp
 */
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Format phone number for M-Pesa (254XXXXXXXXX)
 * @param {string} phone - Phone number (can be 0712345678 or 254712345678)
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    // Remove any spaces or dashes
    phone = phone.replace(/\s|-/g, '');
    
    // If starts with 0, replace with 254
    if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!phone.startsWith('254')) {
        phone = '254' + phone;
    }
    
    return phone;
}

/**
 * Test M-Pesa API Connection (Demo Mode)
 * Tests OAuth authentication via backend to avoid CORS issues
 * @returns {Promise<Object>} Test result
 */
async function testMpesaConnection() {
    try {
        console.log('🧪 Testing M-Pesa API connection via backend...');
        console.log('📋 Consumer Key:', MPESA_CONFIG.CONSUMER_KEY.substring(0, 10) + '...');
        
        // Check if backend URL is configured
        if (!MPESA_CONFIG.BACKEND_URL) {
            return {
                success: false,
                message: 'Backend URL not configured',
                error: 'Please set MPESA_CONFIG.BACKEND_URL in mpesa-api.js',
                oauthWorking: false
            };
        }
        
        // Test OAuth token generation via backend
        const response = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ OAuth authentication successful!');
            console.log('🔑 Access token received:', data.accessToken);
            
            // Check if passkey is configured
            const hasPasskey = MPESA_CONFIG.PASSKEY && 
                              MPESA_CONFIG.PASSKEY !== 'YOUR_PASSKEY_HERE' && 
                              MPESA_CONFIG.PASSKEY.trim() !== '';
            
            return {
                success: true,
                message: data.message || 'M-Pesa API connection successful!',
                oauthWorking: true,
                hasPasskey: hasPasskey,
                details: {
                    accessToken: data.accessToken,
                    expiresIn: data.expiresIn,
                    tokenType: data.tokenType,
                    baseUrl: MPESA_CONFIG.BASE_URL,
                    businessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE
                }
            };
        } else {
            throw new Error(data.error || 'Test failed');
        }
    } catch (error) {
        console.error('❌ M-Pesa API connection test failed:', error);
        
        // Check if it's a network/backend error
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('NetworkError')) {
            return {
                success: false,
                message: 'Cannot connect to backend server',
                error: 'Make sure your backend server is running on ' + (MPESA_CONFIG.BACKEND_URL || 'http://localhost:8000'),
                oauthWorking: false,
                needsBackend: true
            };
        }
        
        return {
            success: false,
            message: 'M-Pesa API connection failed',
            error: error.message,
            oauthWorking: false
        };
    }
}

/**
 * Initiate M-Pesa STK Push (via Backend Server)
 * @param {string} phoneNumber - Customer phone number
 * @param {number} amount - Amount to charge
 * @param {string} orderId - Order ID for reference
 * @returns {Promise<Object>} STK Push response
 */
async function initiateStkPush(phoneNumber, amount, orderId) {
    try {
        // Check if backend URL is configured
        if (!MPESA_CONFIG.BACKEND_URL || MPESA_CONFIG.BACKEND_URL.includes('localhost') || MPESA_CONFIG.BACKEND_URL.includes('your-mpesa-backend')) {
            return {
                success: false,
                error: 'M-Pesa backend server not configured. The backend server needs to be deployed to Render.com. Please use M-Pesa Till 3193269 or contact support.',
                needsBackend: true,
                backendUrl: MPESA_CONFIG.BACKEND_URL
            };
        }
        
        console.log('📱 Initiating M-Pesa STK Push via backend...');
        console.log('Phone:', phoneNumber);
        console.log('Amount:', amount);
        console.log('Backend URL:', MPESA_CONFIG.BACKEND_URL);
        
        // First, test if backend is reachable
        try {
            const testResponse = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!testResponse.ok) {
                return {
                    success: false,
                    error: `Backend server is not responding correctly (Status: ${testResponse.status}). Please check if the backend is deployed and running on Render.com.`,
                    needsBackend: true,
                    suggestAlternative: true
                };
            }
        } catch (testError) {
            console.error('Backend connectivity test failed:', testError);
            return {
                success: false,
                error: `Cannot reach M-Pesa backend server at ${MPESA_CONFIG.BACKEND_URL}. The server may not be deployed or is down. Please use M-Pesa Till 3193269 or contact support.`,
                needsBackend: true,
                suggestAlternative: true,
                testError: testError.message
            };
        }
        
        // Make request to backend server
        const response = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/stkpush`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                amount: amount,
                orderId: orderId
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: response.statusText };
            }
            console.error('❌ STK Push failed:', errorData);
            
            if (response.status === 404) {
                return {
                    success: false,
                    error: 'M-Pesa endpoint not found. The backend server may not be properly configured. Please use M-Pesa Till 3193269.',
                    needsBackend: true,
                    suggestAlternative: true
                };
            }
            
            throw new Error(errorData.error || `STK Push failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ STK Push sent successfully!');
            console.log('Checkout Request ID:', data.checkoutRequestID);
            return {
                success: true,
                checkoutRequestID: data.checkoutRequestID,
                customerMessage: data.customerMessage,
                merchantRequestID: data.merchantRequestID
            };
        } else {
            throw new Error(data.error || 'STK Push failed');
        }
    } catch (error) {
        console.error('❌ Error initiating STK Push:', error);
        
        // Handle network/backend errors
        const errorMessage = error.message || '';
        const isNetworkError = errorMessage.includes('Failed to fetch') || 
                              errorMessage.includes('CORS') || 
                              errorMessage.includes('NetworkError') ||
                              errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                              errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
                              errorMessage.includes('timeout') ||
                              error.name === 'TypeError' ||
                              error.name === 'AbortError';
        
        if (isNetworkError) {
            return {
                success: false,
                error: `Cannot connect to M-Pesa payment server. The backend at ${MPESA_CONFIG.BACKEND_URL} may not be deployed or is unreachable. Please use M-Pesa Till 3193269 or contact support.`,
                needsBackend: true,
                suggestAlternative: true,
                backendUrl: MPESA_CONFIG.BACKEND_URL
            };
        }
        
        return {
            success: false,
            error: errorMessage || 'Payment request failed. Please try again or use M-Pesa Till 3193269.'
        };
    }
}

/**
 * Query STK Push status
 * Uses backend server to avoid CORS issues
 * @param {string} checkoutRequestID - Checkout Request ID from STK Push
 * @returns {Promise<Object>} Query response
 */
async function queryStkPushStatus(checkoutRequestID) {
    try {
        if (!MPESA_CONFIG.BACKEND_URL || MPESA_CONFIG.BACKEND_URL.includes('localhost')) {
            throw new Error('Backend server not configured');
        }
        
        // Use backend server to avoid CORS issues
        const response = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                checkoutRequestID: checkoutRequestID
            })
        });
        
        if (!response.ok) {
            throw new Error(`Query failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error querying STK Push status:', error);
        throw error;
    }
}

/**
 * Verify a manual M-Pesa transaction ID (Paybill/Till) via backend.
 * Your backend should call Safaricom "Transaction Status" API and return { valid: true/false, ... }.
 * Add endpoint e.g. POST BACKEND_URL/api/mpesa/transaction-status with body { transactionId, amount }.
 * Until then, manual payment codes are only format-validated and verified by admin in the admin panel.
 * @param {string} transactionId - M-Pesa transaction/receipt ID from customer
 * @param {number} expectedAmount - Expected amount in KSH (optional)
 * @returns {Promise<Object>} { valid: boolean, message?: string }
 */
async function verifyManualMpesaTransaction(transactionId, expectedAmount) {
    if (!MPESA_CONFIG.BACKEND_URL || !transactionId) return null;
    try {
        const res = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/transaction-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: transactionId.trim(), amount: expectedAmount })
        });
        if (!res.ok) return { valid: false, message: 'Verification unavailable' };
        return await res.json();
    } catch (e) {
        console.warn('verifyManualMpesaTransaction:', e);
        return null;
    }
}

/**
 * Verify M-Pesa payment (called from your server after callback)
 * @param {string} mpesaReceiptNumber - M-Pesa receipt number
 * @returns {Promise<Object>} Verification result
 */
async function verifyMpesaPayment(mpesaReceiptNumber) {
    // This should be implemented on your backend server
    // The server should verify the payment with M-Pesa and return the result
    // For now, this is a placeholder
    
    try {
        const response = await fetch('/api/mpesa/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receiptNumber: mpesaReceiptNumber
            })
        });
        
        if (!response.ok) {
            throw new Error('Verification failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error verifying M-Pesa payment:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initiateStkPush,
        queryStkPushStatus,
        verifyMpesaPayment,
        verifyManualMpesaTransaction,
        formatPhoneNumber,
        testMpesaConnection,
        getMpesaAccessToken,
        MPESA_CONFIG
    };
}

// Expose for use in checkout (manual payment) and console
if (typeof window !== 'undefined') {
    window.testMpesaConnection = testMpesaConnection;
    window.verifyManualMpesaTransaction = verifyManualMpesaTransaction;
    console.log('💡 Tip: Run testMpesaConnection() in the console to test your M-Pesa API credentials!');
}

