import axios from 'axios';
import AuthService from './auth';
import config from '../config';

const API_URL = `${config.API_URL}/auth`; // ✅ Add /auth to base URL

class RideService {
  
  async reverseGeocode(lat, lng) {
    try {
      console.log('📍 [Service] Reverse geocoding:', { lat, lng });
      
      const response = await axios.post(`${API_URL}/reverse-geocode/`, {
        lat: lat,
        lng: lng
      }, {
        headers: AuthService.getAuthHeader(),
        timeout: 10000
      });
      
      console.log('✅ [Service] Reverse geocode success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [Service] Reverse geocoding error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        address: `Current Location (${lat?.toFixed(4) || '0.0000'}, ${lng?.toFixed(4) || '0.0000'})`,
        display_name: `Current Location (${lat?.toFixed(4) || '0.0000'}, ${lng?.toFixed(4) || '0.0000'})`,
        lat: lat,
        lng: lng,
        is_fallback: true
      };
    }
  }

  async setCurrentLocation(locationData) {
    try {
      console.log('📍 [Service] Setting current location:', locationData);
      
      const response = await axios.post(`${API_URL}/set-current-location/`, locationData, {
        headers: AuthService.getAuthHeader(),
        timeout: 15000
      });
      
      console.log('✅ [Service] Location set successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [Service] Set current location error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data_sent: locationData
      });
      
      let errorMessage = 'Failed to set location';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid location data provided';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to set location';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Location setting timed out';
      }
      
      throw new Error(errorMessage);
    }
  }

  async calculateRoute(routeData) {
    try {
      console.log('🔄 [Service] Calculating route:', routeData);
      
      const response = await axios.post(`${API_URL}/rides/calculate-route/`, routeData, {
        headers: AuthService.getAuthHeader(),
        timeout: 30000
      });
      
      console.log('✅ [Service] Route calculated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [Service] Route calculation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to calculate route';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Route calculation timed out. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async autocompleteAddress(query, locationData = {}) {
    try {
      console.log('🔍 [Service] Autocomplete query:', query, 'Location:', locationData);
      
      const requestData = { query };
      
      if (locationData.lat && locationData.lng) {
        requestData.lat = locationData.lat;
        requestData.lng = locationData.lng;
      }
      
      const response = await axios.post(`${API_URL}/autocomplete-address/`, requestData, {
        headers: AuthService.getAuthHeader(),
        timeout: 10000
      });
      
      console.log('✅ [Service] Autocomplete results:', response.data.suggestions?.length || 0);
      return response.data.suggestions || [];
    } catch (error) {
      console.error('❌ [Service] Autocomplete error:', error.response?.data || error.message);
      return [];
    }
  }

  async requestRide(rideData) {
    try {
      console.log('🚗 [Service] Requesting ride:', rideData);
      
      // Validate required fields
      if (!rideData.pickup_address || !rideData.dropoff_address) {
        throw new Error('Pickup and dropoff addresses are required');
      }
      
      const response = await axios.post(`${API_URL}/rides/request/`, rideData, {
        headers: AuthService.getAuthHeader(),
        timeout: 30000
      });
      
      console.log('✅ [Service] Ride requested successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [Service] Ride request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to request ride';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.service_type) {
        errorMessage = `Service type error: ${error.response.data.service_type[0]}`;
      }
      
      throw new Error(errorMessage);
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
      console.log('✅ [Service] Ride history loaded:', response.data?.length || 0, 'rides');
      return response.data || [];
    } catch (error) {
      console.error('❌ [Service] Error fetching ride history:', error);
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
      console.error('❌ [Service] Geocoding error:', error);
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

  // NEW: Test backend connectivity
  async testBackendConnection() {
    try {
      const response = await axios.get(`${API_URL}/test-google-api/`, {
        headers: AuthService.getAuthHeader(),
        timeout: 10000
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Backend is reachable',
        url: API_URL
      };
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return {
        success: false,
        error: error.message,
        message: `Cannot connect to backend at ${API_URL}`,
        url: API_URL
      };
    }
  }

  // NEW: Validate coordinates with backend
  async validateCoordinates(lat, lng) {
    try {
      const response = await axios.post(`${API_URL}/reverse-geocode/`, {
        lat: lat,
        lng: lng
      }, {
        headers: AuthService.getAuthHeader()
      });
      
      return {
        valid: true,
        data: response.data,
        message: 'Coordinates are valid'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Invalid coordinates or service unavailable'
      };
    }
  }
}

export default new RideService();