import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la petición:', error);
    if (error.response) {
      return Promise.reject({
        message: error.response.data?.message || 'Error en el servidor',
        status: error.response.status,
        data: error.response.data
      });
    }
    return Promise.reject(error);
  }
);

export default api;