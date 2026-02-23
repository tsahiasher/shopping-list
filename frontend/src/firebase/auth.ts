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
  } catch (error: any) {
    console.error("Error checking admin claim status:", error);
    
    // If the error is an unauthenticated or permission denied error,
    // it's highly likely the rules are deployed and blocking access, 
    // OR we just can't read it. If we can't be sure, we should default 
    // to login to avoid 'email-already-in-use' errors.
    if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
       // If we lack permissions to read the config doc, it probably exists
       // and is locked down (e.g., if rules are not what we expect).
       // Actually, with our rules, anyone can read /config/admin.
       // The error might be because Firebase Auth isn't fully set up or offline.
       // Let's assume claimed = true safely so they don't try to recreate.
       console.warn("Permission denied checking admin status. Assuming admin exists.");
       return true; 
    }
    
    // By default, if we can't tell, assume there IS an admin to prevent them from
    // attempting to create a new one when the DB is just offline/unreachable.
    return true;
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

  // If config/admin doesn't exist (e.g., account created manually or interrupted flow), create it
  try {
    const configDocRef = doc(db, "config", "admin");
    const docSnap = await getDoc(configDocRef);
    if (!docSnap.exists()) {
      await setDoc(configDocRef, { uid: userCredential.user.uid });
    }
  } catch (error) {
    console.error("Could not verify/set admin claim after login:", error);
  }

  return userCredential.user;
}

/**
 * Logs out the current admin user.
 */
export async function logoutAdmin(): Promise<void> {
  return signOut(auth);
}
