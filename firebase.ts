// firebaseConfig.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWWQh-Ianyh04edBBRtuhPbGLVnw_2JCM",
  authDomain: "cloudattend-1d63e.firebaseapp.com",
  projectId: "cloudattend-1d63e",
  storageBucket: "cloudattend-1d63e.appspot.com", 
  messagingSenderId: "156518331951",
  appId: "1:156518331951:web:9c3385b53ab0ae56cdb8da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
