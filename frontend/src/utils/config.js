// Centralized configuration for API URLs
// In production, set VITE_API_URL at build time (e.g., https://api.yourdomain.com/api)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3434/api";

// Base URL without /api suffix — used for static assets, uploads, socket.io
const API_BASE_URL = API_URL.replace(/\/api\/?$/, "");

export { API_URL, API_BASE_URL };
