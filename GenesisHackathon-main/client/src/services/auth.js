import api from './api';

const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const signup = async (name, email, password, location, geo) => {
    const response = await api.post('/auth/signup', { name, email, password, location, geo });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        return null;
    }
};

const authService = {
    login,
    signup,
    logout,
    getCurrentUser
};

export default authService;
