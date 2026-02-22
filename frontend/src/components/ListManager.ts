import { subscribeToLists, createList, deleteList } from '../firebase/db';
import type { ShoppingList } from '../types';

export class ListManager {
  private container: HTMLUListElement;
  private form: HTMLFormElement;
  private input: HTMLInputElement;
  
  private lists: ShoppingList[] = [];
  private activeListId: string | null = null;
  private onListSelected: (list: ShoppingList | null) => void;

  constructor(
    containerId: string, 
    formId: string, 
    inputId: string,
    onListSelected: (list: ShoppingList | null) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLUListElement;
    this.form = document.getElementById(formId) as HTMLFormElement;
    this.input = document.getElementById(inputId) as HTMLInputElement;
    this.onListSelected = onListSelected;

    this.init();
  }

  private init() {
    // Setup form submission
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = this.input.value.trim();
      if (name) {
        try {
          await createList(name);
          this.input.value = '';
        } catch (error) {
          console.error("Error creating list: ", error);
          alert("Could not create list. Check Firebase configuration.");
        }
      }
    });

    // Subscribe to real-time updates from Firestore
    subscribeToLists((updatedLists) => {
      this.lists = updatedLists;
      this.render();
      
      // If the active list was deleted, clear selection
      if (this.activeListId && !this.lists.find(l => l.id === this.activeListId)) {
        this.selectList(null);
      }
    });
  }

  private selectList(listId: string | null) {
    this.activeListId = listId;
    const selectedList = this.lists.find(l => l.id === listId) || null;
    this.onListSelected(selectedList);
    this.render(); // Re-render to update active styling
  }

  private async handleDelete(id: string, e: Event) {
    e.stopPropagation(); // Prevent selecting the list when clicking delete
    if (confirm("Are you sure you want to delete this list?")) {
      try {
        await deleteList(id);
      } catch (error) {
        console.error("Error deleting list", error);
      }
    }
  }

  private render() {
    this.container.innerHTML = '';
    
    if (this.lists.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No lists yet. Create one!</div>';
      return;
    }

    this.lists.forEach(list => {
      const li = document.createElement('li');
      if (list.id === this.activeListId) {
        li.classList.add('active');
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'list-name';
      nameSpan.textContent = list.name;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '×';
      deleteBtn.onclick = (e) => this.handleDelete(list.id, e);

      li.appendChild(nameSpan);
      li.appendChild(deleteBtn);
      
      li.onclick = () => this.selectList(list.id);

      this.container.appendChild(li);
    });
  }
}
