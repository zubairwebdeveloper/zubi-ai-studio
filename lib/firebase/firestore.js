import { doc, getDoc } from "firebase/firestore";

import { db } from "./config";

export async function getUserProfile(uid) {
  if (!uid) {
    throw new Error("User ID is required.");
  }

  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}
