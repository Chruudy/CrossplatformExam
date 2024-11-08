// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { app, analytics };
export default app;