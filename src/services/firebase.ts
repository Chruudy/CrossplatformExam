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

const firebaseConfig = {
  apiKey: "AIzaSyA1oDPqeL_hL2KMrw3uKWnmLfY7RFHeJHg",
  authDomain: "artvista-2c1e0.firebaseapp.com",
  projectId: "artvista-2c1e0",
  storageBucket: "artvista-2c1e0.firebasestorage.app",
  messagingSenderId: "718463587029",
  appId: "1:718463587029:web:afaee1edc20f43e56d085c",
  measurementId: "G-BN3LTMBFCD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
let auth: Auth;

if (Capacitor.isNativePlatform()) {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
  });
} else {
  auth = getAuth(app);
}

export { app, analytics, storage, auth, db };
export default app;