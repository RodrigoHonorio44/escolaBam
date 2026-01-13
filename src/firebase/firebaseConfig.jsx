// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// ADICIONADO 'export' para que os outros serviços possam ler estas chaves
export const firebaseConfig = {
  apiKey: "AIzaSyB5Ivo0ibsVjChKbcK4Ko02-JWcKNQhN48",
  authDomain: "bamescolar.firebaseapp.com",
  projectId: "bamescolar",
  storageBucket: "bamescolar.firebasestorage.app",
  messagingSenderId: "470515542256",
  appId: "1:470515542256:web:e16218c1519ffe1f75fa35"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;