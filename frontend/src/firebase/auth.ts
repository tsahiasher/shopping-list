import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  fetchSignInMethodsForEmail
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
 * Checks if the given email is already registered.
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.warn("Could not check if email is registered:", error);
    return false;
  }
}

/**
 * Set the admin claim explicitly after a successful login/registration.
 */
export async function setAdminClaim(uid: string): Promise<void> {
  try {
    const configDocRef = doc(db, "config", "admin");
    const docSnap = await getDoc(configDocRef);
    if (!docSnap.exists()) {
      await setDoc(configDocRef, { uid });
    }
  } catch (error) {
    console.error("Could not set admin claim:", error);
  }
}

/**
 * Checks if an admin has already been claimed for this app.
 */
export async function isAdminClaimed(): Promise<boolean> {
  try {
    const configDocRef = doc(db, "config", "admin");
    const docSnap = await getDoc(configDocRef);
    return docSnap.exists() && !!docSnap.data().uid;
  } catch (error: any) {
    console.warn("Could not check if admin is claimed. Defaulting to true (login requires it).", error);
    
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
    await setAdminClaim(user.uid);
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
  await setAdminClaim(userCredential.user.uid);

  return userCredential.user;
}

/**
 * Logs out the current admin user.
 */
export async function logoutAdmin(): Promise<void> {
  return signOut(auth);
}
