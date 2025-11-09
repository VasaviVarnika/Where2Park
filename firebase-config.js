// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBW3XHCtFiAxRPwR0-iLPsk5o6QyAdpd6Y",
    authDomain: "where2park-29694.firebaseapp.com",
    projectId: "where2park-29694",
    storageBucket: "where2park-29694.firebasestorage.app",
    messagingSenderId: "605330525276",
    appId: "1:605330525276:web:0302a0adb52b4f8f4eea99",
    measurementId: "G-HN1S9VQVMP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseRTDB = rtdb;