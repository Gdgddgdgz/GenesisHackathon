import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const aiApi = axios.create({
    baseURL: 'http://localhost:8000',
});

export default api;
