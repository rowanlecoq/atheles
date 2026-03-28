import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDt9l46jwcXMkbJsvPEV0TzU00XoVZMpdo",
  authDomain: "athelesco.firebaseapp.com",
  projectId: "athelesco",
  storageBucket: "athelesco.firebasestorage.app",
  messagingSenderId: "330392960201",
  appId: "1:330392960201:web:7c1a50a8ba1b84308fa118",
  measurementId: "G-H1SPKRERGF",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
const auth = getAuth(app);

export { app, auth };
