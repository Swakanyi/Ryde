import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_URL}/auth`;

const api = axios.create({
  baseURL: API_URL,
});

class UserService {
  getAuthHeader() {
    const token = sessionStorage.getItem('access_token');
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {};
  }

  
  async getProfile() {
    try {
      const response = await api.get('/customer/profile/', {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/customer/profile/', profileData, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

 
  async getPaymentMethods() {
    try {
      const response = await api.get('/customer/payment-methods/', {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async addPaymentMethod(paymentData) {
    try {
      const response = await api.post('/customer/payment-methods/', paymentData, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async deletePaymentMethod(paymentId) {
    try {
      const response = await api.delete(`/customer/payment-methods/${paymentId}/`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async setDefaultPaymentMethod(paymentId) {
    try {
      const response = await api.post(`/customer/payment-methods/${paymentId}/set-default/`, {}, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

 
  async getChatHistory() {
    try {
      const response = await api.get('/customer/chat-history/', {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  
  async getCustomerStats() {
    try {
      const response = await api.get('/customer/stats/', {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getRideHistory() {
    try {
      const response = await api.get('/rides/my-rides/', {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  
  updateSessionStorage(userData) {
    if (userData.first_name && userData.last_name) {
      sessionStorage.setItem('user_name', `${userData.first_name} ${userData.last_name}`);
    }
    if (userData.email) {
      sessionStorage.setItem('user_email', userData.email);
    }
    if (userData.phone_number) {
      sessionStorage.setItem('user_phone', userData.phone_number);
    }
  }
}

export default new UserService();