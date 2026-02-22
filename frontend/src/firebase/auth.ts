import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

// --- Authentication UI state ---
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// --- Admin Configuration ---

/**
 * Checks if an admin has already been claimed for this app.
 */
export async function isAdminClaimed(): Promise<boolean> {
  try {
    const configDocRef = doc(db, "config", "admin");
    const docSnap = await getDoc(configDocRef);
    return docSnap.exists() && !!docSnap.data().uid;
  } catch (error) {
    console.error("Error checking admin claim status:", error);
    // In a real app we might want to handle permission denied specifically
    // but for now, we'll assume any error implies no claim/unreachable.
    return false;
  }
}

/**
 * Registers a user and sets them as the admin.
 * Only works if no admin has been claimed yet.
 */
export async function registerAdmin(email: string, password: string): Promise<User> {
  const claimed = await isAdminClaimed();
  if (claimed) {
    throw new Error("An admin account has already been created.");
  }

  // Create the Firebase Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  try {
    // Save their UID as the admin in config/admin
    const configDocRef = doc(db, "config", "admin");
    await setDoc(configDocRef, { uid: user.uid });
    return user;
  } catch (error) {
    // If setting the admin fails, clean up the created auth user
    await user.delete();
    throw new Error("Failed to set admin configuration.");
  }
}

/**
 * Logs in the admin user using Firebase Auth.
 */
export async function loginAdmin(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Logs out the current admin user.
 */
export async function logoutAdmin(): Promise<void> {
  return signOut(auth);
}
