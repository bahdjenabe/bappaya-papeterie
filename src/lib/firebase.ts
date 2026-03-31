// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7zpv_ZEddiPZsJdk9_l52STWtIUB3A6k",
  authDomain: "bappayapapeterie.firebaseapp.com",
  projectId: "bappayapapeterie",
  storageBucket: "bappayapapeterie.firebasestorage.app",
  messagingSenderId: "567418807798",
  appId: "1:567418807798:web:e03a8b9f9c45069d1013d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);