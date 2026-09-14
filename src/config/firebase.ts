import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnvPd7O4G89kWkc5kkviCsVr8MhtJIWK8",
  authDomain: "elderly-wellbeing-app.firebaseapp.com",
  projectId: "elderly-wellbeing-app",
  storageBucket: "elderly-wellbeing-app.firebasestorage.app",
  messagingSenderId: "316725151745",
  appId: "1:316725151745:web:48b033369c1391d0cd9800",
  measurementId: "G-0RDJB86LVR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
