import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (e) {
        console.error("Auth interceptor error:", e);
    }
    return config;
});

export const aiApi = axios.create({
    baseURL: 'http://localhost:8000',
});

export default api;
