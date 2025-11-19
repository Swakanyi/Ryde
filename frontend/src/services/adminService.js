import axios from 'axios';
import AuthService from './auth';

const API_URL = 'http://localhost:8000/api/auth';

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

  async approveDriver(userId) {
    try {
      const response = await axios.post(`${API_URL}/admin/drivers/${userId}/approve/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Approve driver error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }

  async rejectDriver(userId, rejectionData) {
    try {
      const response = await axios.post(`${API_URL}/admin/drivers/${userId}/reject/`, rejectionData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Reject driver error:', error.response?.data || error);
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