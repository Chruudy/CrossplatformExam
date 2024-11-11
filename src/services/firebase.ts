// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // Import getAuth from Firebase Auth SDK

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1oDPqeL_hL2KMrw3uKWnmLfY7RFHeJHg",
  authDomain: "artvista-2c1e0.firebaseapp.com",
  projectId: "artvista-2c1e0",
  storageBucket: "artvista-2c1e0.appspot.com",
  messagingSenderId: "718463587029",
  appId: "1:718463587029:web:afaee1edc20f43e56d085c",
  measurementId: "G-BN3LTMBFCD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize auth

export { app, analytics, storage, auth }; // Export auth
export default app;