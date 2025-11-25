import axios from 'axios';
import AuthService from './auth';
import config from '../config';

const API_URL = `${config.API_URL}/auth`;

class AdminService {
  
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getUsers(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/admin/users/`, {
        params,
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getUserDetail(userId) {
    try {
      const response = await axios.get(`${API_URL}/admin/users/${userId}/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getRides(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/admin/rides/`, {
        params,
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getRideDetail(rideId) {
    try {
      const response = await axios.get(`${API_URL}/admin/rides/${rideId}/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async updateRide(rideId, data) {
    try {
      const response = await axios.put(`${API_URL}/admin/rides/${rideId}/`, data, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async deleteRide(rideId) {
    try {
      const response = await axios.post(`${API_URL}/admin/rides/${rideId}/delete/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

 
  async getRideChat(rideId) {
    try {
      const response = await axios.get(`${API_URL}/admin/rides/${rideId}/chat/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getPendingDrivers() {
    try {
      const response = await axios.get(`${API_URL}/admin/drivers/pending/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getPendingDriversWithDocuments() {
    try {
      const response = await axios.get(`${API_URL}/admin/drivers/pending-with-documents/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getDriverDocuments(driverId) {
    try {
      const response = await axios.get(`${API_URL}/admin/drivers/${driverId}/documents/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  
async downloadDriverDocument(driverId, documentType) {
  try {
    const response = await axios.get(
      `${API_URL}/admin/drivers/${driverId}/documents/${documentType}/download/`, 
      {
        headers: AuthService.getAuthHeader(),
        responseType: 'blob' 
      }
    );

   
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    
    
    const filename = `${documentType}_${driverId}.jpg`;
    
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Download error:', error);
    
    
    try {
      
      const urlResponse = await axios.get(
        `${API_URL}/admin/drivers/${driverId}/documents/${documentType}/url/`, 
        {
          headers: AuthService.getAuthHeader()
        }
      );
      
      const { file_url } = urlResponse.data;
      
     
      const link = document.createElement('a');
      link.href = file_url;
      link.download = `${documentType}_${driverId}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (fallbackError) {
      throw new Error('Download failed');
    }
  }
}

  async approveDriverWithVehicle(driverId, approvalData) {
    try {
      const response = await axios.post(`${API_URL}/admin/drivers/${driverId}/approve-with-vehicle/`, approvalData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getApprovedDrivers() {
    try {
      const response = await axios.get(`${API_URL}/admin/drivers/approved/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async approveDriver(userId, data) {
    try {
      const response = await axios.post(`${API_URL}/admin/drivers/${userId}/approve/`, data, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async suspendDriver(userId) {
    try {
      const response = await axios.post(`${API_URL}/admin/drivers/${userId}/suspend/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getEmergencyRequests(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/admin/emergency-requests/`, {
        params,
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getEarningsReport(period = 'week') {
    try {
      const response = await axios.get(`${API_URL}/admin/reports/earnings/?period=${period}`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getUsageReport() {
    try {
      const response = await axios.get(`${API_URL}/admin/reports/usage/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getNotifications(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/admin/notifications/`, {
        params,
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await axios.post(`${API_URL}/admin/notifications/${notificationId}/read/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async markAllNotificationsRead() {
    try {
      const response = await axios.post(`${API_URL}/admin/notifications/mark-all-read/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async getNotificationPreferences() {
    try {
      const response = await axios.get(`${API_URL}/admin/notification-preferences/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async updateNotificationPreferences(data) {
    try {
      const response = await axios.put(`${API_URL}/admin/notification-preferences/`, data, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  async updateUserStatus(userId, statusData) {
    try {
      const response = await axios.patch(`${API_URL}/admin/users/${userId}/status/`, statusData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Update status error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_URL}/admin/users/${userId}/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_URL}/admin/users/${userId}/`, userData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Update user error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }
}

export default new AdminService();