import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

const api = axios.create({
  baseURL: API_URL,
});

class AuthService {
 
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

  
  logout() {
    const refresh_token = this.getRefreshToken();
    if (refresh_token) {
      api.post('/logout/', { refresh: refresh_token }).catch(() => {});
    }
    this.clearStorage();
  }

  
  getCurrentUser() {
    const user = sessionStorage.getItem('user');  
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
  if (!user) return;
  
 
  sessionStorage.setItem('user', JSON.stringify(user));
  
 
  sessionStorage.setItem('user_type', user.user_type || '');
  sessionStorage.setItem('user_id', user.id || user.user_id || '');
  sessionStorage.setItem('user_name', `${user.first_name || ''} ${user.last_name || ''}`.trim());
  sessionStorage.setItem('is_staff', user.is_staff ? 'true' : 'false');
  sessionStorage.setItem('is_superuser', user.is_superuser ? 'true' : 'false');
  
  console.log('🔐 [AuthService] User data stored:', {
    user_type: user.user_type,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser
  });
}

  
  setTokens({ access, refresh }) {
    sessionStorage.setItem('access_token', access);    
    sessionStorage.setItem('refresh_token', refresh);  
  }

  getAccessToken() {
    return sessionStorage.getItem('access_token');     
  }

  getRefreshToken() {
    return sessionStorage.getItem('refresh_token');   
  }

  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  async refreshToken() {
  const refresh_token = this.getRefreshToken();
  if (!refresh_token) {
    this.logout();
    return null;
  }

  try {
    const response = await api.post('/token/refresh/', { refresh: refresh_token });
    const { access } = response.data;
    sessionStorage.setItem('access_token', access);  
    return access;
  } catch (error) {
    this.logout();
    throw error;
  }
}

 
async verifyToken() {
  try {
    const token = this.getAccessToken();
    if (!token) return false;
    
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      this.clearStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    this.clearStorage();
    return false;
  }
}



async registerWithFiles(formData) {
  try {
    const response = await axios.post(`${API_URL}/register/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}


getAuthHeader() {
  const token = this.getAccessToken();
  return token ? { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {};
}

  clearStorage() {
    sessionStorage.removeItem('access_token');     
    sessionStorage.removeItem('refresh_token');    
    sessionStorage.removeItem('user');            
    sessionStorage.removeItem('user_type');        
    sessionStorage.removeItem('user_id');          
    sessionStorage.removeItem('user_name');
    sessionStorage.removeItem('is_staff');
    sessionStorage.removeItem('is_superuser');        
  }
}

export default new AuthService();
