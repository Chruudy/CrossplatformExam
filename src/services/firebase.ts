// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, storage, auth, db };
export default app;