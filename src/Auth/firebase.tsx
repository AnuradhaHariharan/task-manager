// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfI2YtncVVbAcoBi-7CGmf0TkzfH_71wY",
  authDomain: "task-manager-6432a.firebaseapp.com",
  projectId: "task-manager-6432a",
  storageBucket: "task-manager-6432a.firebasestorage.app",
  messagingSenderId: "689310510702",
  appId: "1:689310510702:web:6432059d5e858b76e0807f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Define types for auth and db
export const auth: Auth = getAuth();
export const db: Firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
