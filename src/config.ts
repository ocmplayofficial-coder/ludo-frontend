export const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  // Development default: local backend
  "http://localhost:5000";
