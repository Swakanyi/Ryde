import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

const api = axios.create({
    baseURL: API_URL,
});

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/register/', userData);
      if (response.data.access) {
        this.setTokens(response.data);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/login/', credentials);
      if (response.data.access) {
        this.setTokens(response.data);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Logout user
  logout() {
    const refresh_token = localStorage.getItem('refresh_token');
    if (refresh_token) {
      api.post('/logout/', { refresh: refresh_token });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  
  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

 
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

 
  setTokens(data) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  }

  
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

 
  isAuthenticated() {
    return !!this.getAccessToken();
  }

 
  async refreshToken() {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (refresh_token) {
        const response = await api.post('/token/refresh/', {
          refresh: refresh_token
        });
        localStorage.setItem('access_token', response.data.access);
        return response.data.access;
      }
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}

export default new AuthService();