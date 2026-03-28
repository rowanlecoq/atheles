"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDt9l46jwcXMkbJsvPEV0TzU00XoVZMpdo",
  authDomain: "athelesco.firebaseapp.com",
  projectId: "athelesco",
  storageBucket: "athelesco.firebasestorage.app",
  messagingSenderId: "330392960201",
  appId: "1:330392960201:web:7c1a50a8ba1b84308fa118",
  measurementId: "G-H1SPKRERGF",
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  }
  return _app;
}

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export { getFirebaseAuth };
