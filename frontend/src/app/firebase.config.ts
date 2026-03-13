import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA3lA_-eVoXNXvMP3o58Eom-777JINDjEc",
  authDomain: "medicore-9d8fd.firebaseapp.com",
  projectId: "medicore-9d8fd",
  storageBucket: "medicore-9d8fd.firebasestorage.app",
  messagingSenderId: "592114368524",
  appId: "1:592114368524:web:2307224bd070280eedee29",
  measurementId: "G-W4J6TZBSD0"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
