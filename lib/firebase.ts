import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZBPBR1TizP6JtG86f6ir1i6feO3XaMpg",
  authDomain: "check-in-9a4d0.firebaseapp.com",
  projectId: "check-in-9a4d0",
  storageBucket: "check-in-9a4d0.firebasestorage.app",
  messagingSenderId: "59534542286",
  appId: "1:59534542286:web:27bef781ac9d45a868579f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };