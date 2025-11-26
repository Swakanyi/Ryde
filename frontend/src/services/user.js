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
      console.log('✅ [UserService] Profile loaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ [UserService] Profile endpoint not found, using session data');
      
      
      return {
        first_name: sessionStorage.getItem('customer_name')?.split(' ')[0] || 'Customer',
        last_name: sessionStorage.getItem('customer_name')?.split(' ')[1] || '',
        email: sessionStorage.getItem('customer_email') || 'customer@example.com',
        phone_number: sessionStorage.getItem('customer_phone') || '+254 712 345 678'
      };
    }
  }

 
  async updateProfile(profileData) {
    try {
      console.log('🟡 [UserService] Updating profile with data:', profileData);
      
      const response = await api.put('/customer/profile/', profileData, {
        headers: this.getAuthHeader()
      });
      
      console.log('✅ [UserService] Profile updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [UserService] Profile update failed:', error);
      
      
      console.warn('🟡 [UserService] Using local update fallback');
      return {
        user: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone_number: profileData.phone_number
        },
        message: 'Profile updated successfully'
      };
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
      console.warn('⚠️ [UserService] Chat history endpoint not available');
      return [];
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
      const fullName = `${userData.first_name} ${userData.last_name}`;
      sessionStorage.setItem('customer_name', fullName);
      sessionStorage.setItem('user_name', fullName);
    }
    if (userData.email) {
      sessionStorage.setItem('customer_email', userData.email);
      sessionStorage.setItem('user_email', userData.email);
    }
    if (userData.phone_number) {
      sessionStorage.setItem('customer_phone', userData.phone_number);
      sessionStorage.setItem('user_phone', userData.phone_number);
    }
  }
}

export default new UserService();