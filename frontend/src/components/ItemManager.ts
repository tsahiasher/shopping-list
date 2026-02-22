import { subscribeToItems, createItem, toggleItemCompletion, deleteItem } from '../firebase/db';
import type { ShoppingList, ShoppingItem } from '../types';
import type { Unsubscribe } from 'firebase/firestore';

export class ItemManager {
  private container: HTMLUListElement;
  private form: HTMLFormElement;
  private input: HTMLInputElement;
  private titleElement: HTMLHeadingElement;
  
  private activeList: ShoppingList | null = null;
  private items: ShoppingItem[] = [];
  private unsubscribe: Unsubscribe | null = null;

  constructor(
    containerId: string, 
    formId: string, 
    inputId: string,
    titleId: string
  ) {
    this.container = document.getElementById(containerId) as HTMLUListElement;
    this.form = document.getElementById(formId) as HTMLFormElement;
    this.input = document.getElementById(inputId) as HTMLInputElement;
    this.titleElement = document.getElementById(titleId) as HTMLHeadingElement;

    this.init();
  }

  private init() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.activeList) return;
      
      const name = this.input.value.trim();
      if (name) {
        try {
          await createItem(this.activeList.id, name);
          this.input.value = '';
        } catch (error) {
          console.error("Error adding item: ", error);
          alert("Could not add item. Check Firebase configuration.");
        }
      }
    });
  }

  public setActiveList(list: ShoppingList | null) {
    this.activeList = list;
    
    // Cleanup previous subscription
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (list) {
      this.titleElement.textContent = list.name;
      this.form.style.display = 'flex'; // Show form
      
      // Subscribe to items for this list
      this.unsubscribe = subscribeToItems(list.id, (updatedItems) => {
        this.items = updatedItems;
        this.render();
      });
    } else {
      this.titleElement.textContent = "Select a list";
      this.form.style.display = 'none'; // Hide form
      this.items = [];
      this.render();
    }
  }

  private async handleToggle(item: ShoppingItem) {
    try {
      await toggleItemCompletion(item.id, item.isCompleted);
    } catch (error) {
      console.error("Error toggling item", error);
    }
  }

  private async handleDelete(id: string) {
    try {
      await deleteItem(id);
    } catch (error) {
      console.error("Error deleting item", error);
    }
  }

  private render() {
    this.container.innerHTML = '';
    
    if (!this.activeList) {
      this.container.innerHTML = '<div class="empty-state">Choose a list from the sidebar to view items.</div>';
      return;
    }

    if (this.items.length === 0) {
      this.container.innerHTML = '<div class="empty-state">This list is empty. Add some items!</div>';
      return;
    }

    this.items.forEach(item => {
      const li = document.createElement('li');
      li.className = `item-row ${item.isCompleted ? 'completed' : ''}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'item-checkbox';
      checkbox.checked = item.isCompleted;
      checkbox.onchange = () => this.handleToggle(item);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = item.name;
      nameSpan.onclick = () => {
         // clicking the text also toggles it
         this.handleToggle(item);
      };
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '×';
      deleteBtn.onclick = () => this.handleDelete(item.id);

      li.appendChild(checkbox);
      li.appendChild(nameSpan);
      li.appendChild(deleteBtn);
      
      this.container.appendChild(li);
    });
  }
}
