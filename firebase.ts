// // firebaseConfig.ts

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCWWQh-Ianyh04edBBRtuhPbGLVnw_2JCM",
//   authDomain: "cloudattend-1d63e.firebaseapp.com",
//   projectId: "cloudattend-1d63e",
//   storageBucket: "cloudattend-1d63e.appspot.com", 
//   messagingSenderId: "156518331951",
//   appId: "1:156518331951:web:9c3385b53ab0ae56cdb8da"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Export initialized services
// export const auth = getAuth(app);
// export const db = getFirestore(app);




// firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing in Expo Fast Refresh
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
