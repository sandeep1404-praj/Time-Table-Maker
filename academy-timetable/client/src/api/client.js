import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://time-table-maker.onrender.com"
});

export default api;
