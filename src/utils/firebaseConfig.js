// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzwvRB31hYOxqDHUtij-vPhqJQucDhD5U",
  authDomain: "cryptilo.firebaseapp.com",
  databaseURL: "https://cryptilo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cryptilo",
  storageBucket: "cryptilo.firebasestorage.app",
  messagingSenderId: "321400328819",
  appId: "1:321400328819:web:cadf22c1bd25c498779006",
  measurementId: "G-TJB6W79KPE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, db, rtdb };