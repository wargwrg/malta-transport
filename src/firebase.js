import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBm62cqgeFN3i2c_zX8Ii-FhOkU6zHNmiQ",
  authDomain: "malta-transport-a168b.firebaseapp.com",
  databaseURL: "https://malta-transport-a168b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "malta-transport-a168b",
  storageBucket: "malta-transport-a168b.firebasestorage.app",
  messagingSenderId: "335215700628",
  appId: "1:335215700628:web:a210b43706339c8a3ee281"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);