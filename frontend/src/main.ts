import './style.css';
import { AuthManager } from './components/AuthManager';
import { ListManager } from './components/ListManager';
import { ItemManager } from './components/ItemManager';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AuthManager first
  new AuthManager(() => {
    // Only initialize the application managers once authenticated
    const itemManager = new ItemManager(
      'items-container',
      'new-item-form',
      'new-item-input',
      'current-list-title'
    );

    new ListManager(
      'lists-container',
      'new-list-form',
      'new-list-input',
      (selectedList) => {
        itemManager.setActiveList(selectedList);
      }
    );
  });
});
