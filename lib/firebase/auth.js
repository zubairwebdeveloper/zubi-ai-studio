import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  reload,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Create Firestore User Profile
export async function createUserProfile(user, { name }) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: name || user.displayName || "",
    email: user.email,
    role: "STUDENT",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Register User
export async function registerUser({ name, email, password }) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(result.user, {
    displayName: name,
  });

  await createUserProfile(result.user, { name });

  await sendEmailVerification(result.user);

  return result.user;
}

// Email Login
export async function loginUser({ email, password }) {
  const result = await signInWithEmailAndPassword(auth, email, password);

  return result.user;
}

// Google Login
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);

  return result.user;
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}

// Password Reset
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// Resend Verification Email
export async function resendVerificationEmail() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please login first.");
  }

  await reload(user);

  if (user.emailVerified) {
    return;
  }

  await sendEmailVerification(user);
}

// Refresh Current User
export async function refreshCurrentUser() {
  const user = auth.currentUser;

  if (!user) return null;

  await reload(user);

  return auth.currentUser;
}
