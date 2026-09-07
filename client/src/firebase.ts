import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmtGMKMTWZQlAT0b53Kca8l399tKHneIU",
  authDomain: "travelboost-19a1f.firebaseapp.com",
  projectId: "travelboost-19a1f",
  storageBucket: "travelboost-19a1f.firebasestorage.app",
  messagingSenderId: "148003950109",
  appId: "1:148003950109:web:494cf8f3b03140b448c0f4",
  measurementId: "G-MMZ82QPQDT",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const appleProvider = new OAuthProvider("apple.com");