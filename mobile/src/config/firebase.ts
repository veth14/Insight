import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, initializeAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDnhM2aC3LyCdaMni9beyhBWNt0lTLvKOA",
  authDomain: "qcuresearchapp.firebaseapp.com",
  projectId: "qcuresearchapp",
  storageBucket: "qcuresearchapp.appspot.com",
  messagingSenderId: "261576043973",
  appId: "1:261576043973:web:92fc27979e034cb3c42fac",
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

// Singleton pattern to avoid re-initialization on Fast Refresh
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth with persistence using Async Storage (Resolves "Memory Persistence" warning)
  // @ts-ignore - getReactNativePersistence is not correctly typed in all firebase versions but works at runtime
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

storage = getStorage(app);

export { auth, storage };
export default app;
