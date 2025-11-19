import axios from 'axios';
import AuthService from './auth';


const API_URL = 'http://localhost:8000/api/auth';

class Ride {
  
  async requestRide(rideData) {
    try {
      const response = await axios.post(`${API_URL}/rides/request/`, rideData, {
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
      console.error('Error fetching ride messages:', error);
      return [];
    }
  }

 
  async getRideHistory() {
    try {
      const response = await axios.get(`${API_URL}/rides/my-rides/`, {
        headers: AuthService.getAuthHeader()
      });
      console.log('✅ [RideService] Ride history loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ride history:', error);
      return [];
    }
  }

  async geocodeAddress(addressData) {
    try {
      const response = await axios.post(`${API_URL}/map/geocode/`, addressData, {
        headers: AuthService.getAuthHeader()
      });
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
      const response = await axios.post(`${API_URL}/rides/${ride_id}/accept/`, {}, {
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

  async autocompleteAddress(query) {
    try {
      const response = await axios.post(`${API_URL}/autocomplete/`, { query }, {
        headers: AuthService.getAuthHeader()
      });
      return response.data.suggestions;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.post(`${API_URL}/place-details/`, { place_id: placeId }, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Place details error:', error);
      throw error.response?.data || error;
    }
  }

  async getDriverInfo(driverId) {
    try {
      const response = await axios.get(`${API_URL}/driver/${driverId}/info/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver info:', error);
      throw error.response?.data || error;
    }
  }

  async sendChatMessage(rideId, message) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/send-message/`, {
        content: message,
        message_type: 'text'
      }, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error.response?.data || error;
    }
  }
}

export default new Ride();