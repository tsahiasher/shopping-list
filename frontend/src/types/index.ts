// Source data types mapping to Firestore
export interface ShoppingList {
  id: string; // Firestore document ID
  name: string;
  createdAt: number; // Timestamp
}

export interface ShoppingItem {
  id: string; // Firestore document ID
  listId: string;
  name: string;
  isCompleted: boolean;
  createdAt: number; // Timestamp
}
