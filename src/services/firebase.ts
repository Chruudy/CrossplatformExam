// Import the necessary functions and SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  getAuth,
  Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyA1oDPqeL_hL2KMrw3uKWnmLfY7RFHeJHg",
  authDomain: "artvista-2c1e0.firebaseapp.com",
  projectId: "artvista-2c1e0",
  storageBucket: "artvista-2c1e0.firebasestorage.app",
  messagingSenderId: "718463587029",
  appId: "1:718463587029:web:afaee1edc20f43e56d085c",
  measurementId: "G-BN3LTMBFCD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Auth with different persistence based on platform
let auth: Auth;
if (Capacitor.isNativePlatform()) {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
  });
} else {
  auth = getAuth(app);
}

// Export initialized Firebase services
export { app, analytics, storage, auth, db };
export default app;