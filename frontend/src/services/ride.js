import axios from 'axios';
import AuthService from './auth';

const API_URL = 'http://localhost:8000/api/auth';

class Ride {
  // Request new ride
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

  // Get available rides (for drivers)
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

  // Accept a ride (for drivers)
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

  // ride details
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

  //  driver location
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

  // address suggestions
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
}

export default new Ride();