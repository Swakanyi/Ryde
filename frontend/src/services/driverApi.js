
import axios from 'axios';
import AuthService from './auth';

const API_URL = 'http://localhost:8000/api/auth';

class DriverService {
  
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

 
  async toggleOnlineStatus(data) {
  try {
    const response = await axios.post(`${API_URL}/driver/toggle-online/`, 
      data,  
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

 
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


async declineRide(rideId) {
  try {
    const response = await axios.post(`${API_URL}/rides/${rideId}/decline/`, {}, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('❌ [DriverService] Decline ride error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
}


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