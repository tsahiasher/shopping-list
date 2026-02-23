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
 * Dynamically logs in or registers the user, dealing with Firebase
 * Email Enumeration Protection which blocks fetching existing accounts.
 */
export async function loginOrRegisterAdmin(email: string, password: string): Promise<User> {
  try {
    // 1. Attempt to Sign In First
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // If successful, claim it
    await setAdminClaim(userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    // 'auth/user-not-found' (older SDKs) or 'auth/invalid-credential'
    // indicates we should try creating the account instead.
    // If they provided the WRONG password for a known email, we still get 'invalid-credential' 
    // due to enumeration protection, so createUser will then throw 'email-already-in-use'
    // which proves they just typed the wrong password.
    
    try {
      // 2. Attempt to Create Account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setAdminClaim(userCredential.user.uid);
      return userCredential.user;
    } catch (createError: any) {
      // If we attempt to create and get email-already-in-use, it means the earlier 
      // login failed *only* because of a bad password, not because the user doesn't exist.
      if (createError.code === "auth/email-already-in-use") {
        throw new Error("Invalid password for this account.");
      }
      throw createError;
    }
  }
}

/**
 * Logs out the current admin user.
 */
export async function logoutAdmin(): Promise<void> {
  return signOut(auth);
}
