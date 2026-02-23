import { 
  subscribeToAuthChanges, 
  loginOrRegisterAdmin,
  logoutAdmin
} from "../firebase/auth";
import type { User } from "firebase/auth";

export class AuthManager {
  private overlay: HTMLDivElement;
  private title: HTMLHeadingElement;
  private form: HTMLFormElement;
  private emailInput: HTMLInputElement;
  private passwordInput: HTMLInputElement;
  private submitBtn: HTMLButtonElement;
  private errorDisplay: HTMLDivElement;
  private loadingDisplay: HTMLDivElement;
  private logoutBtn: HTMLButtonElement;
  private toggleBtn: HTMLDivElement;

  private onAuthSuccess: (user: User) => void;
  private currentMode: "loading" | "login" | "setup" | "authenticated" = "loading";

  constructor(onAuthSuccess: (user: User) => void) {
    this.onAuthSuccess = onAuthSuccess;

    // Grab elements
    this.overlay = document.getElementById("auth-overlay") as HTMLDivElement;
    this.title = document.getElementById("auth-title") as HTMLHeadingElement;
    this.form = document.getElementById("auth-form") as HTMLFormElement;
    this.emailInput = document.getElementById("auth-email") as HTMLInputElement;
    this.passwordInput = document.getElementById("auth-password") as HTMLInputElement;
    this.submitBtn = document.getElementById("auth-submit-btn") as HTMLButtonElement;
    this.errorDisplay = document.getElementById("auth-error") as HTMLDivElement;
    this.loadingDisplay = document.getElementById("auth-loading") as HTMLDivElement;
    this.logoutBtn = document.getElementById("auth-logout-btn") as HTMLButtonElement;

    this.toggleBtn = document.createElement("div");
    this.toggleBtn.style.cursor = "pointer";
    this.toggleBtn.style.color = "#3b82f6";
    this.toggleBtn.style.textDecoration = "underline";
    this.toggleBtn.style.fontSize = "0.9rem";
    this.toggleBtn.style.textAlign = "center";
    this.form.appendChild(this.toggleBtn);

    this.init();
  }

  private init() {
    // Listen for auth changes
    subscribeToAuthChanges((user) => {
      this.handleAuthChange(user);
    });

    this.toggleBtn.addEventListener("click", () => {
      this.clearError();
      if (this.currentMode === "login") {
        this.setMode("setup");
      } else {
        this.setMode("login");
      }
    });

    // Make toggle btn hidden since we are auto-detecting
    this.toggleBtn.style.display = "none";

    // Handle form submit
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = this.emailInput.value;
      const pass = this.passwordInput.value;
      this.clearError();

      if (!email || !pass) {
        this.showError("Email and password are required.");
        return;
      }

      this.submitBtn.disabled = true;

      try {
        await loginOrRegisterAdmin(email, pass);
        // If successful, onAuthStateChanged will fire and handle UI update
      } catch (error: any) {
        let msg = "Authentication failed.";
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
          msg = "Invalid email or password.";
        } else if (error.code === "auth/weak-password") {
          msg = "Password should be at least 6 characters.";
        } else if (error.message) {
          msg = error.message;
        }
        this.showError(msg);
      } finally {
        this.submitBtn.disabled = false;
      }
    });

    this.logoutBtn.addEventListener("click", () => {
      logoutAdmin();
    });
  }

  private async handleAuthChange(user: User | null) {
    if (user) {
      // Authenticated
      this.setMode("authenticated");
      this.onAuthSuccess(user);
    } else {
      // Not authenticated, just show the login/setup form
      this.setMode("login");
    }
  }

  private setMode(mode: "loading" | "login" | "setup" | "authenticated") {
    this.currentMode = mode;
    this.clearError();

    // Reset UI blocks
    this.form.style.display = "none";
    this.loadingDisplay.style.display = "none";
    this.logoutBtn.style.display = "none";
    this.passwordInput.value = ""; // clear password

    if (mode === "loading") {
      this.title.textContent = "Checking Authentication...";
      this.loadingDisplay.style.display = "block";
      this.toggleBtn.style.display = "none";
      this.overlay.classList.remove("hidden");
    } else if (mode === "login" || mode === "setup") {
      // We merge login and setup into a single generic "Authenticate" mode
      this.title.textContent = "Admin Login / Setup";
      this.submitBtn.textContent = "Continue";
      this.toggleBtn.style.display = "none";
      this.form.style.display = "flex";
      this.overlay.classList.remove("hidden");
    } else if (mode === "authenticated") {
      // Hide overlay
      this.overlay.classList.add("hidden");
      
      // Move logout button to a better place or show it somewhere else. 
      // For now we'll prepend it to the body or app header so user can log out.
      // Easiest is to add it to the header dynamically.
      this.addLogoutButtonToHeader();
    }
  }

  private addLogoutButtonToHeader() {
    const header = document.querySelector(".app-header");
    if (header && !document.getElementById("header-logout-btn")) {
      const btn = document.createElement("button");
      btn.id = "header-logout-btn";
      btn.className = "btn-secondary logout-top-right";
      btn.textContent = "Logout";
      // styling inline for quick MVP or rely on CSS
      btn.style.position = "absolute";
      btn.style.top = "1rem";
      btn.style.right = "1rem";
      btn.style.padding = "0.5rem 1rem";
      btn.style.background = "transparent";
      btn.style.border = "1px solid var(--text-secondary)";
      btn.style.color = "var(--text-secondary)";
      btn.style.borderRadius = "var(--radius-md)";
      btn.style.cursor = "pointer";

      btn.addEventListener("click", () => logoutAdmin());
      header.appendChild(btn);
    }
  }

  private showError(msg: string) {
    this.errorDisplay.textContent = msg;
  }

  private clearError() {
    this.errorDisplay.textContent = "";
  }
}
