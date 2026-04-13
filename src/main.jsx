import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/**
 * LUDO PRO - MAIN ENTRY POINT
 * Fast, Stable & Optimized for Mobile Web
 */

// 1. CSS Imports (Ensure index.css is loaded globally)
import "./index.css";

// 2. Render logic
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Root element not found. Check your index.html");
}

ReactDOM.createRoot(rootElement).render(
  <>
    {/* 🔥 App contains the SocketProvider and BrowserRouter 
       to ensure context is available in all routes.
    */}
    <App />
  </>
);

/**
 * DEV NOTE: 
 * StrictMode will cause double-invoking of useEffect in Dev mode. 
 * This is normal and helps catch socket leak issues early.
 */