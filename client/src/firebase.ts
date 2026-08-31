// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmtGMKMTWZQlAT0b53Kca8l399tKHneIU",
  authDomain: "travelboost-19a1f.firebaseapp.com",
  projectId: "travelboost-19a1f",
  storageBucket: "travelboost-19a1f.firebasestorage.app",
  messagingSenderId: "148003950109",
  appId: "1:148003950109:web:494cf8f3b03140b448c0f4",
  measurementId: "G-MMZ82QPQDT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Authentication Provider
export const googleProvider =
  new GoogleAuthProvider();

// Apple Authentication Provider
export const appleProvider =
  new OAuthProvider("apple.com");