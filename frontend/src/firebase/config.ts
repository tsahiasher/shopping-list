// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8JdO3EBlgfdYCLiXf2Ft8hN1QG8J9iZM",
  authDomain: "shopping-list68.firebaseapp.com",
  projectId: "shopping-list68",
  storageBucket: "shopping-list68.firebasestorage.app",
  messagingSenderId: "964219927638",
  appId: "1:964219927638:web:8f3bea7f28dc1490c88ff7",
  measurementId: "G-9PBHDGC4Z9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);