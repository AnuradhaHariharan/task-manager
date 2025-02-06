// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfI2YtncVVbAcoBi-7CGmf0TkzfH_71wY",
  authDomain: "task-manager-6432a.firebaseapp.com",
  projectId: "task-manager-6432a",
  storageBucket: "task-manager-6432a.firebasestorage.app",
  messagingSenderId: "689310510702",
  appId: "1:689310510702:web:6432059d5e858b76e0807f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth();
export const db=getFirestore(app);
export default app;