import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from "firebase/firestore";
import { db } from "./config";
import type { ShoppingList, ShoppingItem } from "../types";

// Collection References
const listsCollection = collection(db, "lists");
const itemsCollection = collection(db, "items");

// --- Lists ---

export function subscribeToLists(callback: (lists: ShoppingList[]) => void) {
  const q = query(listsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShoppingList));
    callback(lists);
  });
}

export async function createList(name: string) {
  return await addDoc(listsCollection, {
    name,
    createdAt: Date.now()
  });
}

export async function deleteList(id: string) {
  await deleteDoc(doc(db, "lists", id));
  // Note: For a robust app, we'd also delete all items where listId === id.
  // We can do this on the frontend or via a Firebase serverless function. 
  // For simplicity, we just delete the list here.
}

// --- Items ---

export function subscribeToItems(listId: string, callback: (items: ShoppingItem[]) => void) {
  const q = query(
    itemsCollection, 
    where("listId", "==", listId),
    orderBy("createdAt", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShoppingItem));
    callback(items);
  });
}

export async function createItem(listId: string, name: string) {
  return await addDoc(itemsCollection, {
    listId,
    name,
    isCompleted: false,
    createdAt: Date.now()
  });
}

export async function toggleItemCompletion(id: string, currentStatus: boolean) {
  const itemRef = doc(db, "items", id);
  await updateDoc(itemRef, {
    isCompleted: !currentStatus
  });
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, "items", id));
}
