import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle unhandled promise rejections from browser extensions (like MetaMask)
window.addEventListener('unhandledrejection', (event) => {
  // Check if the error is from a browser extension (like MetaMask)
  if (event.reason?.message?.includes('MetaMask') || 
      event.reason?.stack?.includes('chrome-extension://') ||
      event.reason?.message?.includes('Failed to connect') ||
      (typeof event.reason === 'string' && event.reason.includes('MetaMask'))) {
    // Prevent the error from being logged to console and showing overlay
    event.preventDefault();
    event.stopImmediatePropagation();
    // Silently suppress - no console output
    return false;
  }
});

// Also handle regular errors from extensions
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('MetaMask') || 
      event.error?.stack?.includes('chrome-extension://') ||
      event.filename?.includes('chrome-extension://')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
