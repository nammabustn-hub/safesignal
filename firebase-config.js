
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUBNNDxgtPCP2ky_vcAVWV9IVtdAEp9rs",
  authDomain: "safesignal-22407.firebaseapp.com",
  projectId: "safesignal-22407",
  storageBucket: "safesignal-22407.firebasestorage.app",
  messagingSenderId: "560630364759",
  appId: "1:560630364759:web:b62f087794092a44670112",
  measurementId: "G-PWDTZGFVHP"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Google Login Provider
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Initialize Firestore
const db = getFirestore(app);

// Export Firebase services
export {
  app,
  auth,
  db,
  googleProvider
};
