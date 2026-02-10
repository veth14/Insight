import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

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
} else {
  app = getApp();
}

// Use standard getAuth() as requested.
// This is the most stable method for Expo Go / Managed Workflow.
// Note: Persistence might be limited to memory/session in some Expo Go versions.
auth = getAuth(app);
storage = getStorage(app);

export { auth, storage };
export default app;
