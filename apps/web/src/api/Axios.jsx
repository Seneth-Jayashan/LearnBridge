import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let memoryAccessToken = null;

export const setAccessToken = (token) => {
    memoryAccessToken = token;
};

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Crucial
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (memoryAccessToken) {
            config.headers.Authorization = `Bearer ${memoryAccessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // THE FIX: Circuit Breaker
        // If the request that failed with 401 WAS the refresh route, reject immediately!
        // This stops the infinite loop and passes the error back to checkSession()
        if (error.response?.status === 401 && originalRequest.url.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // CALL API DIRECTLY (No authService import)
                const { data } = await api.post("/auth/refresh");
                console.log("Token refreshed successfully. New Access Token:", data.accessToken);
                
                setAccessToken(data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;