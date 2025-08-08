// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  projectId: "trimology",
  appId: "1:170094637668:web:73f711de3dd200ff11e571",
  storageBucket: "trimology.appspot.com",
  apiKey: "AIzaSyBUZq9DtKvHSeyWOWOQTp_D7g8i4OOYQMM",
  authDomain: "trimology.firebaseapp.com",
  messagingSenderId: "170094637668",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
