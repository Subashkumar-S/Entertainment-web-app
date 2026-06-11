import axios from "axios";

// Single shared axios instance for all calls to our own backend API.
// The base URL is env-driven (VITE_API_BASE_URL) so the same code targets
// localhost in dev and the deployed API in production; withCredentials lets
// the session cookie ride along on every request.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    withCredentials: true,
});

export default api;
