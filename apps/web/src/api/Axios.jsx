import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // If the backend says "Unauthorized" (token expired/invalid), 
            // you might want to redirect to login or clear local storage here.
            // For now, we reject so the Context can handle it.
            console.error("API Error: Unauthorized");
        }
        return Promise.reject(error);
    }
);

export default api;