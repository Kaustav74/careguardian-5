import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle unhandled promise rejections from browser extensions (like MetaMask)
window.addEventListener('unhandledrejection', (event) => {
  // Check if the error is from a browser extension (like MetaMask)
  if (event.reason?.message?.includes('MetaMask') || 
      event.reason?.stack?.includes('chrome-extension://')) {
    // Prevent the error from being logged to console
    event.preventDefault();
    console.warn('Browser extension error suppressed:', event.reason?.message);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
