// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDz6_c9-AUG5hjEPWuMY8sBUZIWyxVUcY",
  authDomain: "my-awesome-project-id-4eb67.firebaseapp.com",
  projectId: "my-awesome-project-id-4eb67",
  storageBucket: "my-awesome-project-id-4eb67.firebasestorage.app",
  messagingSenderId: "53833416764",
  appId: "1:53833416764:web:5410d5a2a5eea13f96c339"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
