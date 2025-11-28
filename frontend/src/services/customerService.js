// CustomerService.js
import axios from 'axios';
import AuthService from './auth';
import config from '../config';

const API_URL = `${config.API_URL}/customer`;

class CustomerService {
  
  async getProfile() {
    try {
      console.log('👤 [CustomerService] Fetching profile...');
      
      const response = await axios.get(`${API_URL}/profile/`, {
        headers: AuthService.getAuthHeader(),
        timeout: 10000
      });
      
      console.log('✅ [CustomerService] Profile loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CustomerService] Profile fetch error:', error);
      throw error.response?.data || error;
    }
  }

  async updateProfile(profileData) {
    try {
      console.log('👤 [CustomerService] Updating profile:', profileData);
      
      const response = await axios.put(`${API_URL}/profile/`, profileData, {
        headers: AuthService.getAuthHeader(),
        timeout: 15000
      });
      
      console.log('✅ [CustomerService] Profile updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CustomerService] Profile update error:', error);
      throw error.response?.data || error;
    }
  }

  async getPaymentMethods() {
    try {
      const response = await axios.get(`${API_URL}/payment-methods/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async updatePaymentMethod(paymentData) {
    try {
      console.log('💳 [CustomerService] Updating payment method:', paymentData);
      
      const response = await axios.post(`${API_URL}/payment-methods/`, paymentData, {
        headers: AuthService.getAuthHeader()
      });
      
      console.log('✅ [CustomerService] Payment method updated');
      return response.data;
    } catch (error) {
      console.error('❌ [CustomerService] Payment update error:', error);
      throw error.response?.data || error;
    }
  }

  async getChatHistory() {
    try {
      const response = await axios.get(`${API_URL}/chat-history/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const response = await axios.get(`${API_URL}/stats/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {};
    }
  }
}

export default new CustomerService();