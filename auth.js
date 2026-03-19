// User Authentication and Points System
// Works with firebase.js: Firebase Auth for sign-in/sign-up; localStorage for profile (points, orders).

function getFirebaseAuth() {
    return (typeof window !== 'undefined' && window.SlayStationFirebase && window.SlayStationFirebase.auth) || null;
}

function firebaseAuthErrorMessage(code) {
    var map = {
        'auth/email-already-in-use': 'Email already registered! Please login instead.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'Account not found. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.'
    };
    return map[code] || 'An error occurred. Please try again.';
}

class UserAuth {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
        var auth = getFirebaseAuth();
        if (auth) {
            var self = this;
            try {
                if (sessionStorage.getItem('firebaseLogoutRequested')) {
                    sessionStorage.removeItem('firebaseLogoutRequested');
                    auth.signOut();
                }
            } catch (e) {}
            auth.onAuthStateChanged(function (fbUser) {
                if (fbUser && fbUser.email) {
                    var profile = self.getProfileByEmail(fbUser.email);
                    if (profile) {
                        self.currentUser = profile;
                        try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(profile)); } catch (e) {}
                    } else {
                        var minimal = {
                            id: fbUser.uid,
                            email: fbUser.email.toLowerCase(),
                            name: fbUser.displayName || fbUser.email.split('@')[0],
                            phone: '',
                            points: 0,
                            orders: [],
                            level: 'Bronze',
                            pointsHistory: [],
                            firebaseUid: fbUser.uid
                        };
                        self.currentUser = minimal;
                        try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(minimal)); } catch (e) {}
                    }
                    if (typeof updateAuthUI === 'function') updateAuthUI();
                } else {
                    self.currentUser = null;
                    try { localStorage.removeItem('slayStationCurrentUser'); } catch (e) {}
                    if (typeof updateAuthUI === 'function') updateAuthUI();
                }
            });
        }
    }

    getProfileByEmail(email) {
        var lower = (email || '').toLowerCase().trim();
        var users = this.getUsers();
        return users.find(function (u) { return (u.email || '').toLowerCase().trim() === lower; }) || null;
    }

    // Sign up (returns Promise for Firebase; sync result wrapped in Promise when no Firebase)
    signup(email, password, name, phone) {
        var self = this;
        var auth = getFirebaseAuth();
        if (auth) {
            var normalizedEmail = (email || '').toLowerCase().trim();
            var displayName = (name || '').trim() || normalizedEmail.split('@')[0];
            return auth.createUserWithEmailAndPassword(normalizedEmail, password)
                .then(function (cred) {
                    var fbUser = cred.user;
                    return (fbUser.sendEmailVerification ? fbUser.sendEmailVerification() : Promise.resolve()).then(function () {
                        var users = self.getUsers();
                        var newUser = {
                            id: fbUser.uid,
                            firebaseUid: fbUser.uid,
                            email: normalizedEmail,
                            name: displayName,
                            phone: (phone || '').trim(),
                            points: 100,
                            orders: [],
                            createdAt: new Date().toISOString(),
                            level: 'Bronze',
                            pointsHistory: [{ amount: 100, reason: 'Welcome bonus', date: new Date().toISOString() }]
                        };
                        users.push(newUser);
                        try {
                            localStorage.setItem('slayStationUsers', JSON.stringify(users));
                            localStorage.setItem('slayStationCurrentUser', JSON.stringify(newUser));
                        } catch (e) {}
                        self.currentUser = newUser;
                        if (typeof updateAuthUI === 'function') updateAuthUI();
                        return { success: true, message: 'Welcome ' + displayName + "! Check your email for a verification link – you'll need it for your first login. You've earned 100 welcome points! 🎉✨", user: newUser };
                    });
                })
                .catch(function (err) {
                    return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
                });
        }
        try {
            var users = this.getUsers();
            var normalizedEmail = (email || '').toLowerCase().trim();
            if (users.find(function (u) { return (u.email || '').toLowerCase().trim() === normalizedEmail; })) {
                return Promise.resolve({ success: false, message: 'Email already registered! Please login instead. 💕' });
            }
            var newUser = {
                id: Date.now(),
                email: normalizedEmail,
                password: password,
                name: (name || '').trim(),
                phone: (phone || '').trim(),
                points: 100,
                orders: [],
                createdAt: new Date().toISOString(),
                level: 'Bronze',
                pointsHistory: [{ amount: 100, reason: 'Welcome bonus', date: new Date().toISOString() }]
            };
            users.push(newUser);
            localStorage.setItem('slayStationUsers', JSON.stringify(users));
            var loginResult = this.loginSync(newUser.email, password);
            if (loginResult.success && loginResult.user) {
                this.currentUser = loginResult.user;
                localStorage.setItem('slayStationCurrentUser', JSON.stringify(loginResult.user));
            }
            return Promise.resolve({ success: true, message: 'Welcome ' + newUser.name + "! You've earned 100 welcome points! 🎉✨", user: newUser });
        } catch (error) {
            return Promise.resolve({ success: false, message: 'An error occurred. Please try again.' });
        }
    }

    // Login (returns Promise when Firebase; otherwise Promise of sync result). Requires email verification on first login.
    login(email, password, isRiderLogin) {
        var self = this;
        var auth = getFirebaseAuth();
        if (auth) {
            var normalizedEmail = (email || '').toLowerCase().trim();
            return auth.signInWithEmailAndPassword(normalizedEmail, password)
                .then(function (cred) {
                    var fbUser = cred.user;
                    if (!fbUser.emailVerified) {
                        auth.signOut();
                        return { success: false, needsVerification: true, email: fbUser.email, message: 'Please verify your email before signing in. We sent a link to ' + fbUser.email + '. Check your inbox (and spam).' };
                    }
                    var profile = self.getProfileByEmail(fbUser.email);
                    if (!profile) {
                        profile = {
                            id: fbUser.uid,
                            firebaseUid: fbUser.uid,
                            email: fbUser.email.toLowerCase(),
                            name: fbUser.displayName || fbUser.email.split('@')[0],
                            phone: '',
                            points: 0,
                            orders: [],
                            level: 'Bronze',
                            pointsHistory: []
                        };
                        var users = self.getUsers();
                        users.push(profile);
                        try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                    }
                    self.currentUser = profile;
                    try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(profile)); } catch (e) {}
                    if (typeof updateAuthUI === 'function') updateAuthUI();
                    var result = { success: true, message: 'Welcome back, ' + profile.name + '! ✨', user: profile };
                    var RIDER_EMAILS = ['preston.mwendwa@riarauniversity.ac.ke', 'kangethekelvin56@gmail.com', 'prestonmugo83@gmail.com'];
                    var isRider = RIDER_EMAILS.some(function (e) { return e.toLowerCase() === normalizedEmail; });
                    if (isRiderLogin && isRider) {
                        localStorage.setItem('riderEmail', normalizedEmail);
                        setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                        result.redirect = 'rider';
                    } else if (isRider) {
                        localStorage.setItem('riderEmail', normalizedEmail);
                        setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                        result.redirect = 'rider';
                    }
                    return result;
                })
                .catch(function (err) {
                    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
                        return auth.createUserWithEmailAndPassword(normalizedEmail, password).then(function (cred) {
                            var fbUser = cred.user;
                            if (fbUser.sendEmailVerification) fbUser.sendEmailVerification();
                            var profile = self.getProfileByEmail(fbUser.email);
                            if (!profile) {
                                profile = {
                                    id: fbUser.uid,
                                    firebaseUid: fbUser.uid,
                                    email: fbUser.email.toLowerCase(),
                                    name: fbUser.displayName || fbUser.email.split('@')[0],
                                    phone: '',
                                    points: 100,
                                    orders: [],
                                    level: 'Bronze',
                                    pointsHistory: [{ amount: 100, reason: 'Welcome bonus', date: new Date().toISOString() }]
                                };
                                var users = self.getUsers();
                                users.push(profile);
                                try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                            }
                            self.currentUser = profile;
                            try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(profile)); } catch (e) {}
                            if (typeof updateAuthUI === 'function') updateAuthUI();
                            return { success: true, message: 'Account linked! Check your email for a verification link – you’ll need it next time you sign in. Welcome! ✨', user: profile };
                        }).catch(function (createErr) {
                            if (createErr.code === 'auth/email-already-in-use') {
                                return { success: false, message: 'Incorrect password. Use "Forgot password?" to reset.' };
                            }
                            return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
                        });
                    }
                    return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
                });
        }
        return Promise.resolve(this.loginSync(email, password));
    }

    // Sign in with Google using Firebase popup (avoids OAuth origin errors; uses Firebase's authorized domains)
    loginWithGooglePopup() {
        var self = this;
        var auth = getFirebaseAuth();
        if (!auth) return Promise.resolve({ success: false, message: 'Firebase Auth not available.' });
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
            return Promise.resolve({ success: false, message: 'Firebase Auth SDK not loaded.' });
        }
        var provider = new firebase.auth.GoogleAuthProvider();
        return auth.signInWithPopup(provider)
            .then(function (cred) {
                var fbUser = cred.user;
                var isNewUser = cred.additionalUserInfo && cred.additionalUserInfo.isNewUser;
                var profile = self.getProfileByEmail(fbUser.email);
                if (!profile) {
                    profile = {
                        id: fbUser.uid,
                        firebaseUid: fbUser.uid,
                        email: fbUser.email.toLowerCase(),
                        name: fbUser.displayName || fbUser.email.split('@')[0],
                        phone: '',
                        points: isNewUser ? 100 : 0,
                        orders: [],
                        level: 'Bronze',
                        pointsHistory: isNewUser ? [{ amount: 100, reason: 'Welcome bonus', date: new Date().toISOString() }] : [],
                        profilePicture: (fbUser.photoURL || '').trim(),
                        googleSignIn: true
                    };
                    var users = self.getUsers();
                    users.push(profile);
                    try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                } else {
                    if (!profile.googleSignIn) {
                        profile.googleSignIn = true;
                        var users = self.getUsers();
                        var idx = users.findIndex(function (u) { return u.id === profile.id; });
                        if (idx >= 0) {
                            users[idx] = profile;
                            try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                        }
                    }
                }
                self.currentUser = profile;
                try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(profile)); } catch (e) {}
                if (typeof updateAuthUI === 'function') updateAuthUI();
                var result = { success: true, message: isNewUser ? ('Welcome ' + profile.name + "! You've earned 100 welcome points! 🎉✨") : ('Welcome back, ' + profile.name + '! ✨'), user: profile };
                var normalizedEmail = profile.email.toLowerCase();
                var RIDER_EMAILS = ['preston.mwendwa@riarauniversity.ac.ke', 'kangethekelvin56@gmail.com', 'prestonmugo83@gmail.com'];
                var isRider = RIDER_EMAILS.some(function (e) { return e.toLowerCase() === normalizedEmail; });
                if (isRider) {
                    localStorage.setItem('riderEmail', normalizedEmail);
                    result.redirect = 'rider';
                    setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                }
                return result;
            })
            .catch(function (err) {
                return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
            });
    }

    // Sign in with Google (Firebase): pass the id_token from GSI response.credential
    loginWithGoogleIdToken(idToken) {
        var self = this;
        var auth = getFirebaseAuth();
        if (!auth) {
            return Promise.resolve({ success: false, message: 'Firebase Auth not available.' });
        }
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
            return Promise.resolve({ success: false, message: 'Firebase Auth SDK not loaded.' });
        }
        var credential = firebase.auth.GoogleAuthProvider.credential(idToken);
        return auth.signInWithCredential(credential)
            .then(function (cred) {
                var fbUser = cred.user;
                var isNewUser = cred.additionalUserInfo && cred.additionalUserInfo.isNewUser;
                var profile = self.getProfileByEmail(fbUser.email);
                if (!profile) {
                    profile = {
                        id: fbUser.uid,
                        firebaseUid: fbUser.uid,
                        email: fbUser.email.toLowerCase(),
                        name: fbUser.displayName || fbUser.email.split('@')[0],
                        phone: '',
                        points: isNewUser ? 100 : 0,
                        orders: [],
                        level: 'Bronze',
                        pointsHistory: isNewUser ? [{ amount: 100, reason: 'Welcome bonus', date: new Date().toISOString() }] : [],
                        profilePicture: (fbUser.photoURL || '').trim(),
                        googleSignIn: true
                    };
                    var users = self.getUsers();
                    users.push(profile);
                    try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                } else {
                    if (!profile.googleSignIn) {
                        profile.googleSignIn = true;
                        var users = self.getUsers();
                        var idx = users.findIndex(function (u) { return u.id === profile.id; });
                        if (idx >= 0) {
                            users[idx] = profile;
                            try { localStorage.setItem('slayStationUsers', JSON.stringify(users)); } catch (e) {}
                        }
                    }
                }
                self.currentUser = profile;
                try { localStorage.setItem('slayStationCurrentUser', JSON.stringify(profile)); } catch (e) {}
                if (typeof updateAuthUI === 'function') updateAuthUI();
                var result = { success: true, message: isNewUser ? ('Welcome ' + profile.name + "! You've earned 100 welcome points! 🎉✨") : ('Welcome back, ' + profile.name + '! ✨'), user: profile };
                var normalizedEmail = profile.email.toLowerCase();
                var RIDER_EMAILS = ['preston.mwendwa@riarauniversity.ac.ke', 'kangethekelvin56@gmail.com', 'prestonmugo83@gmail.com'];
                var isRider = RIDER_EMAILS.some(function (e) { return e.toLowerCase() === normalizedEmail; });
                if (isRider) {
                    localStorage.setItem('riderEmail', normalizedEmail);
                    result.redirect = 'rider';
                    setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                }
                return result;
            })
            .catch(function (err) {
                return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
            });
    }

    loginSync(email, password, isRiderLogin) {
        try {
            var users = this.getUsers();
            var emailLower = (email || '').toLowerCase().trim();
            var user = users.find(function (u) {
                return (u.email || '').toLowerCase().trim() === emailLower && u.password === password;
            });
            if (!user) {
                var emailExists = users.find(function (u) { return (u.email || '').toLowerCase().trim() === emailLower; });
                return { success: false, message: emailExists ? 'Incorrect password! Please try again. 💕' : 'Account not found! Please sign up first. 💕' };
            }
            this.currentUser = user;
            localStorage.setItem('slayStationCurrentUser', JSON.stringify(user));
            var RIDER_EMAILS = ['preston.mwendwa@riarauniversity.ac.ke', 'kangethekelvin56@gmail.com', 'prestonmugo83@gmail.com'];
            var normalizedEmail = emailLower;
            var isRider = RIDER_EMAILS.some(function (e) { return e.toLowerCase() === normalizedEmail; });
            if (isRiderLogin && isRider) {
                localStorage.setItem('riderEmail', normalizedEmail);
                setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                return { success: true, message: 'Welcome back, ' + user.name + '! Redirecting... ✨', user: user, redirect: 'rider' };
            }
            if (isRider) {
                localStorage.setItem('riderEmail', normalizedEmail);
                setTimeout(function () { window.location.href = 'rider-dashboard.html'; }, 500);
                return { success: true, message: 'Welcome back, ' + user.name + '! Redirecting... ✨', user: user, redirect: 'rider' };
            }
            return { success: true, message: 'Welcome back, ' + user.name + '! ✨', user: user };
        } catch (e) {
            return { success: false, message: 'An error occurred during login. Please try again.' };
        }
    }

    // Resend verification email (signs in with password, sends email, signs out). Returns Promise<{ success, message }>.
    resendEmailVerification(email, password) {
        var auth = getFirebaseAuth();
        if (!auth) return Promise.resolve({ success: false, message: 'Auth not available.' });
        var normalizedEmail = (email || '').toLowerCase().trim();
        return auth.signInWithEmailAndPassword(normalizedEmail, password)
            .then(function (cred) {
                var fbUser = cred.user;
                return (fbUser.sendEmailVerification ? fbUser.sendEmailVerification() : Promise.resolve()).then(function () {
                    auth.signOut();
                    return { success: true, message: 'Verification email sent! Check your inbox (and spam).' };
                });
            })
            .catch(function (err) {
                return { success: false, message: firebaseAuthErrorMessage(err.code) || err.message };
            });
    }

    logout() {
        var auth = getFirebaseAuth();
        if (auth) {
            auth.signOut().catch(function () {});
        } else {
            try { sessionStorage.setItem('firebaseLogoutRequested', '1'); } catch (e) {}
        }
        this.currentUser = null;
        localStorage.removeItem('slayStationCurrentUser');
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            this.loadCurrentUser();
        }
        return this.currentUser;
    }

    // Load current user from storage (when Firebase Auth is used, state comes from onAuthStateChanged)
    loadCurrentUser() {
        if (getFirebaseAuth()) return;
        var userJson = localStorage.getItem('slayStationCurrentUser');
        if (userJson) {
            try {
                var sessionUser = JSON.parse(userJson);
                var users = this.getUsers();
                var updatedUser = users.find(function (u) { return u.id === sessionUser.id; });

                if (updatedUser) {
                    this.currentUser = updatedUser;
                    localStorage.setItem('slayStationCurrentUser', JSON.stringify(updatedUser));
                } else if (sessionUser && sessionUser.id && sessionUser.email) {
                    var allUsers = this.getUsers();
                    allUsers.push(sessionUser);
                    localStorage.setItem('slayStationUsers', JSON.stringify(allUsers));
                    this.currentUser = sessionUser;
                } else {
                    this.currentUser = null;
                    localStorage.removeItem('slayStationCurrentUser');
                }
            } catch (error) {
                this.currentUser = null;
                localStorage.removeItem('slayStationCurrentUser');
            }
        }
    }

    // Get all users
    getUsers() {
        try {
            const usersJson = localStorage.getItem('slayStationUsers');
            if (!usersJson) {
                console.log('No users found in localStorage, initializing empty array');
                return [];
            }
            const users = JSON.parse(usersJson);
            if (!Array.isArray(users)) {
                console.error('Users data is not an array, resetting');
                localStorage.setItem('slayStationUsers', JSON.stringify([]));
                return [];
            }
            console.log(`Retrieved ${users.length} users from storage`);
            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            // Return empty array if there's an error
            return [];
        }
    }

    // Update user
    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('slayStationUsers', JSON.stringify(users));
            
            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = users[index];
                localStorage.setItem('slayStationCurrentUser', JSON.stringify(users[index]));
            }
            
            return users[index];
        }
        return null;
    }

    // Add points history entry
    addPointsHistory(userId, amount, reason, orderId = null) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return;

        const pointsHistory = user.pointsHistory || [];
        pointsHistory.push({
            amount: amount,
            reason: reason,
            date: new Date().toISOString(),
            orderId: orderId
        });

        // Keep only last 20 entries
        if (pointsHistory.length > 20) {
            pointsHistory.shift();
        }

        this.updateUser(userId, { pointsHistory: pointsHistory });
    }

    // Award points for order
    awardPointsForOrder(userId, orderTotal, orderId = null) {
        // Award 1 point per 100 KSH spent
        const pointsEarned = Math.floor(orderTotal / 100);
        
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return 0;

        const newPoints = (user.points || 0) + pointsEarned;
        
        // Update user level based on total points
        let level = 'Bronze';
        if (newPoints >= 1000) level = 'Gold';
        else if (newPoints >= 500) level = 'Silver';
        
        this.updateUser(userId, {
            points: newPoints,
            level: level
        });

        // Add to points history
        if (pointsEarned > 0) {
            this.addPointsHistory(userId, pointsEarned, `Order #${orderId || 'N/A'} - ${pointsEarned} points earned`, orderId);
        }
        
        return pointsEarned;
    }

    // Redeem points (for future use)
    redeemPoints(userId, pointsToRedeem) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user || (user.points || 0) < pointsToRedeem) {
            return { success: false, message: 'Insufficient points! 💕' };
        }

        const newPoints = user.points - pointsToRedeem;
        this.updateUser(userId, { points: newPoints });
        
        return { success: true, remainingPoints: newPoints };
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Create global instance
const userAuth = new UserAuth();

// Make functions globally available
if (typeof window !== 'undefined') {
    window.userAuth = userAuth;
    
    window.signup = function(email, password, name, phone) {
        try {
            if (!email || !password) {
                return Promise.resolve({ success: false, message: 'Please enter email and password! 💕' });
            }
            if (!(name || '').trim()) {
                return Promise.resolve({ success: false, message: 'Please enter your name! 💕' });
            }
            if (password.length < 6) {
                return Promise.resolve({ success: false, message: 'Password must be at least 6 characters long! 💕' });
            }
            if (!email.includes('@') || !email.includes('.')) {
                return Promise.resolve({ success: false, message: 'Please enter a valid email address! 💕' });
            }
            return userAuth.signup(email, password, (name || '').trim(), (phone == null ? '' : String(phone)));
        } catch (error) {
            return Promise.resolve({ success: false, message: 'An error occurred during signup. Please try again! 💕' });
        }
    };

    window.login = function(email, password, isRiderLogin) {
        try {
            if (!email || !password) {
                return Promise.resolve({ success: false, message: 'Please enter both email and password! 💕' });
            }
            return userAuth.login(email, password, isRiderLogin);
        } catch (error) {
            return Promise.resolve({ success: false, message: 'An error occurred during login. Please try again! 💕' });
        }
    };
    
    window.logout = function() {
        try {
            userAuth.logout();
            if (window.app) {
                window.app.loadPage('home');
            }
            updateAuthUI();
            
            // Redirect to home if not already there
            if (window.location.pathname.includes('admin.html') || 
                window.location.pathname.includes('rider-dashboard.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
    window.isLoggedIn = function() {
        return userAuth.isLoggedIn();
    };
    
    window.getCurrentUser = function() {
        return userAuth.getCurrentUser();
    };
}

// Update auth UI (show/hide login buttons, user info)
function updateAuthUI() {
    const user = userAuth.getCurrentUser();
    
    // Update nav bar
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const navActions = document.querySelector('.nav-actions');
    
    // Check if order history link exists, if not create it
    let orderHistoryLink = document.getElementById('orderHistoryLink');
    const navMenu = document.querySelector('.nav-menu');
    
    // Mobile menu footer: when logged in show Profile + Log out; when not, show Sign in + Sign up
    const navMenuFooter = document.querySelector('.nav-menu-footer');
    if (navMenuFooter) {
        let menuProfile = document.getElementById('navMenuProfile');
        let menuLogout = document.getElementById('navMenuLogout');
        const menuSignin = navMenuFooter.querySelector('.nav-menu-signin');
        const menuSignup = navMenuFooter.querySelector('.nav-menu-signup');
        if (!menuProfile) {
            menuProfile = document.createElement('a');
            menuProfile.id = 'navMenuProfile';
            menuProfile.href = 'account.html';
            menuProfile.className = 'nav-menu-signin';
            menuProfile.setAttribute('aria-label', 'Profile');
            menuProfile.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6"/></svg> Profile';
            navMenuFooter.appendChild(menuProfile);
        }
        if (!menuLogout) {
            menuLogout = document.createElement('button');
            menuLogout.type = 'button';
            menuLogout.id = 'navMenuLogout';
            menuLogout.className = 'nav-menu-logout';
            menuLogout.setAttribute('aria-label', 'Log out');
            menuLogout.innerHTML = 'Log out';
            menuLogout.onclick = function () { if (typeof logout === 'function') logout(); };
            navMenuFooter.appendChild(menuLogout);
        }
        if (user) {
            if (menuSignin) menuSignin.style.display = 'none';
            if (menuSignup) menuSignup.style.display = 'none';
            menuProfile.style.display = 'inline-flex';
            menuLogout.style.display = 'inline-flex';
        } else {
            if (menuSignin) menuSignin.style.display = 'inline-flex';
            if (menuSignup) menuSignup.style.display = 'inline-flex';
            menuProfile.style.display = 'none';
            menuLogout.style.display = 'none';
        }
    }
    
    // Admin button hidden from nav – admin page is not linked; access via direct URL only.
    let adminDashboardBtn = document.getElementById('adminDashboardBtn');
    if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        var myAccountBtn = document.getElementById('myAccountBtn');
        if (myAccountBtn) myAccountBtn.style.display = 'flex';
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
            logoutBtn.onclick = function() { if (typeof logout === 'function') logout(); };
        }
        
        // Show notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.style.display = 'block';
        }
        
        // Update notification badge
        if (typeof window.updateNotificationBadge === 'function') {
            window.updateNotificationBadge();
        }
        
        // Add Order History link to nav menu (visible on every page when logged in)
        if (navMenu && !orderHistoryLink) {
            orderHistoryLink = document.createElement('li');
            orderHistoryLink.id = 'orderHistoryLink';
            orderHistoryLink.innerHTML = '<a href="order-history.html">Order History 📦</a>';
            const contactLink = navMenu.querySelector('li:last-child');
            if (contactLink) {
                navMenu.insertBefore(orderHistoryLink, contactLink);
            } else {
                navMenu.appendChild(orderHistoryLink);
            }
        }
        if (orderHistoryLink) {
            orderHistoryLink.style.display = 'list-item';
        }
        
        // Add Order History icon in nav-actions when logged in (visible on every page)
        let orderHistoryNavBtn = document.getElementById('orderHistoryNavBtn');
        if (navActions && !orderHistoryNavBtn) {
            orderHistoryNavBtn = document.createElement('a');
            orderHistoryNavBtn.id = 'orderHistoryNavBtn';
            orderHistoryNavBtn.href = 'order-history.html';
            orderHistoryNavBtn.className = 'nav-btn-round nav-btn-user';
            orderHistoryNavBtn.title = 'Order History';
            orderHistoryNavBtn.setAttribute('aria-label', 'Order History');
            orderHistoryNavBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
            var ma = document.getElementById('myAccountBtn');
            if (ma && ma.parentNode) ma.parentNode.insertBefore(orderHistoryNavBtn, ma);
            else navActions.appendChild(orderHistoryNavBtn);
        }
        if (orderHistoryNavBtn) orderHistoryNavBtn.style.display = 'flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        var myAccountBtn = document.getElementById('myAccountBtn');
        if (myAccountBtn) myAccountBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Hide notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.style.display = 'none';
        }
        
        // Hide Order History link and nav button
        if (orderHistoryLink) orderHistoryLink.style.display = 'none';
        var orderHistoryNavBtn = document.getElementById('orderHistoryNavBtn');
        if (orderHistoryNavBtn) orderHistoryNavBtn.style.display = 'none';
    }
}

// Update auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure userAuth is initialized and session is loaded
    if (typeof userAuth !== 'undefined' && userAuth) {
        userAuth.loadCurrentUser();
        
        // Debug: Log storage status
        const users = userAuth.getUsers();
        const currentUser = userAuth.getCurrentUser();
        console.log('Auth initialization:', {
            totalUsers: users.length,
            currentUser: currentUser ? { email: currentUser.email, id: currentUser.id } : null,
            localStorageAvailable: typeof Storage !== 'undefined'
        });
    }
    
    updateAuthUI();
    
    // Refresh every 5 seconds to update points
    setInterval(updateAuthUI, 5000);
});

// Debug function to check storage (can be called from browser console)
if (typeof window !== 'undefined') {
    window.debugAuth = function() {
        const users = userAuth.getUsers();
        const currentUser = userAuth.getCurrentUser();
        const usersJson = localStorage.getItem('slayStationUsers');
        const sessionJson = localStorage.getItem('slayStationCurrentUser');
        
        console.log('=== AUTH DEBUG INFO ===');
        console.log('Total users:', users.length);
        console.log('Users:', users.map(u => ({ email: u.email, id: u.id, name: u.name })));
        console.log('Current user:', currentUser ? { email: currentUser.email, id: currentUser.id, name: currentUser.name } : null);
        console.log('Users JSON length:', usersJson ? usersJson.length : 0);
        console.log('Session JSON length:', sessionJson ? sessionJson.length : 0);
        console.log('localStorage available:', typeof Storage !== 'undefined');
        console.log('======================');
        
        return {
            totalUsers: users.length,
            users: users,
            currentUser: currentUser,
            localStorageAvailable: typeof Storage !== 'undefined'
        };
    };
}
