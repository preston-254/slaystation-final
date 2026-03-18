/**
 * Slay Station – Firebase (compat SDK, no build step)
 *
 * Load in HTML before auth.js, in this order:
 *   1. firebase-app-compat.js
 *   2. firebase-analytics-compat.js
 *   3. firebase-auth-compat.js
 *   4. firebase-firestore-compat.js (optional, for admin)
 *   5. firebase-functions-compat.js (optional, for admin callables)
 *   6. firebase.js (this file)
 *   7. auth.js
 *
 * Exposes: window.SlayStationFirebase { app, analytics, auth, firestore?, functions? }
 */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: 'AIzaSyAjAObgwYdamGwMgQtf_cInyjCfM1vy7yk',
    authDomain: 'slay-station-9cad9.firebaseapp.com',
    projectId: 'slay-station-9cad9',
    storageBucket: 'slay-station-9cad9.firebasestorage.app',
    messagingSenderId: '446234683855',
    appId: '1:446234683855:web:eae10c8abdbfb45ede0aba',
    measurementId: 'G-T7PQ720XPH'
  };

  if (typeof firebase === 'undefined') {
    console.warn('Slay Station: Load firebase-app-compat.js before firebase.js');
    window.SlayStationFirebase = { app: null, analytics: null, auth: null };
    return;
  }

  var app = firebase.initializeApp(firebaseConfig);
  var analytics = null;
  var auth = null;
  var firestore = null;
  var functions = null;

  try {
    analytics = firebase.analytics(app);
  } catch (e) {
    console.warn('Firebase Analytics:', e.message);
  }

  try {
    if (typeof firebase.auth === 'function') {
      auth = firebase.auth(app);
    }
  } catch (e) {
    console.warn('Firebase Auth:', e.message);
  }

  try {
    if (typeof firebase.firestore === 'function') {
      firestore = firebase.firestore(app);
    }
  } catch (e) {
    console.warn('Firebase Firestore:', e.message);
  }

  try {
    if (typeof firebase.functions === 'function') {
      // Use same region as Cloud Functions (europe-west1). If your functions use default region, use firebase.functions(app).
      try {
        functions = firebase.functions(app, 'europe-west1');
      } catch (r) {
        functions = firebase.functions(app);
      }
    }
  } catch (e) {
    console.warn('Firebase Functions:', e.message);
  }

  window.SlayStationFirebase = {
    app: app,
    analytics: analytics,
    auth: auth,
    firestore: firestore,
    functions: functions
  };
})();
