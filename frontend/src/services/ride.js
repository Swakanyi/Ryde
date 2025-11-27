import axios from 'axios';
import AuthService from './auth';
import config from '../config';


const API_URL = `${config.API_URL}/auth`;

class RideService {
  
 
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.post(`${API_URL}/reverse-geocode/`, {
        lat: lat,
        lng: lng
      }, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      return {
        address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        display_name: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat: lat,
        lng: lng
      };
    }
  }

  
  async setCurrentLocation(locationData) {
    try {
      const response = await axios.post(`${API_URL}/set-current-location/`, locationData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Set current location error:', error);
      throw error.response?.data || error;
    }
  }

 
  async calculateRoute(routeData) {
    try {
      const response = await axios.post(`${API_URL}/rides/calculate-route/`, routeData, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error.response?.data || error;
    }
  }

  
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
      const response = await axios.post(`${API_URL}/rides/${rideId}/accept/`, {}, {
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

async autocompleteAddress(query, locationData = {}) {
  try {
    console.log('🔍 [Autocomplete] Sending query:', query, 'Location:', locationData);
    
    const requestData = { query };
    
    
    if (locationData.lat && locationData.lng) {
      requestData.lat = locationData.lat;
      requestData.lng = locationData.lng;
    }
    
    const response = await axios.post(`${API_URL}/autocomplete-address/`, requestData, {
      headers: AuthService.getAuthHeader()
    });
    
    console.log('✅ [Autocomplete] Backend response:', response.data);
    return response.data.suggestions || [];
  } catch (error) {
    console.error('❌ [Autocomplete] Error:', error.response?.data || error.message);
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

  
  async declineRide(rideId) {
    try {
      const response = await axios.post(`${API_URL}/rides/${rideId}/decline/`, {}, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

 
  async testGoogleAPI() {
    try {
      const response = await axios.get(`${API_URL}/test-google-api/`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Google API test error:', error);
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
      console.error('Error fetching nearby drivers:', error);
      return [];
    }
  }
}

export default new RideService();