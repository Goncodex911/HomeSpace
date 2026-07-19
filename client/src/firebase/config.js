import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCH-ZKtC1LI7cPWJPbYiZQafznRjPG8Ef4",
  authDomain: "homespace-dcded.firebaseapp.com",
  projectId: "homespace-dcded",
  storageBucket: "homespace-dcded.firebasestorage.app",
  messagingSenderId: "36578946980",
  appId: "1:36578946980:web:0e5dd62174f34041d51b31",
  measurementId: "G-6NB99JQEX8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
