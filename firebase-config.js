import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit // <-- DITAMBAHKAN DI SINI
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Project Warga Tulung
const firebaseConfig = {
  apiKey: "AIzaSyCKPDUaqzCXSekQV3rW1ebZ_xGRr9Fq5hg",
  authDomain: "wargatulung-53739.firebaseapp.com",
  projectId: "wargatulung-53739",
  storageBucket: "wargatulung-53739.firebasestorage.app",
  messagingSenderId: "36501764534",
  appId: "1:36501764534:web:460da038238a9cdee8a917",
  measurementId: "G-32YN9BD5SC"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Instance Sekunder untuk Registrasi Warga oleh Admin
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp");
const secondaryAuth = getAuth(secondaryApp);

export {
  auth,
  db,
  secondaryAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit // <-- DITAMBAHKAN DI SINI
};