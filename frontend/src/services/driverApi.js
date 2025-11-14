
import axios from 'axios';
import AuthService from './auth';

const API_URL = 'http://localhost:8000/api/auth';

class DriverService {
  // Get driver dashboard data
  async getDashboard() {
    try {
      const response = await axios.get(`${API_URL}/driver/dashboard/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Toggle online/offline status
  async toggleOnlineStatus(isOnline) {
    try {
      const response = await axios.post(`${API_URL}/driver/toggle-online/`, 
        { is_online: isOnline },
        { headers: AuthService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get available rides
  async getAvailableRides() {
    try {
      const response = await axios.get(`${API_URL}/rides/available/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Accept a ride
  async acceptRide(rideId) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/accept/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Start a ride (driver picks up customer)
  async startRide(rideId) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/start/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Complete a ride
  async completeRide(rideId) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/complete/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update ride status
  async updateRideStatus(rideId, status) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/status/`, 
        { status },
        { headers: AuthService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update driver location
  async updateDriverLocation(locationData) {
    try {
      const response = await axios.post(`${API_URL}/driver/location/`, locationData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get driver earnings
  async getEarnings(period = 'week') {
    try {
      const response = await axios.get(`${API_URL}/driver/earnings/?period=${period}`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get ride messages
  async getRideMessages(rideId) {
    try {
      const response = await axios.get(`${API_URL}/rides/${rideId}/messages/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Send ride message
  async sendRideMessage(rideId, content) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/send-message/`, 
        { content, message_type: 'text' },
        { headers: AuthService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user's ride history
  async getUserRides() {
    try {
      const response = await axios.get(`${API_URL}/rides/my-rides/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get ride details
  async getRideDetail(rideId) {
    try {
      const response = await axios.get(`${API_URL}/rides/${rideId}/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get nearby drivers (for map view)
  async getNearbyDrivers(lat, lng, radius = 5) {
    try {
      const response = await axios.get(`${API_URL}/map/nearby-drivers/`, {
        params: { lat, lng, radius },
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get pending approval status (for new drivers)
  async getApprovalStatus() {
    try {
      const response = await axios.get(`${API_URL}/driver/dashboard/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new DriverService();