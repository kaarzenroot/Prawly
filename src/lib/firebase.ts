import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUthpsup9ZFh5LGUfCvjEXTedfx31slaw",
  authDomain: "prawly-10671.firebaseapp.com",
  projectId: "prawly-10671",
  storageBucket: "prawly-10671.firebasestorage.app",
  messagingSenderId: "563501428691",
  appId: "1:563501428691:web:0ed383372bec19e794c926",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// ---------- Auth helpers ----------

export async function firebaseSignUp(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name on the Firebase user profile
  await updateProfile(cred.user, { displayName: username });
  // Store extra user data in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    username,
    email,
    createdAt: Date.now(),
  });
  return cred.user;
}

export async function firebaseSignIn(
  email: string,
  password: string
): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function firebaseGoogleSignIn(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // Create Firestore profile if first login
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, "users", user.uid), {
      username: user.displayName || user.email?.split("@")[0] || "user",
      email: user.email,
      createdAt: Date.now(),
    });
  }
  return user;
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, type User };
