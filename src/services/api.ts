import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // untuk cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;