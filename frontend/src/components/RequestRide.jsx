import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RideService from '../services/ride';

const RequestRide = () => {
  const [formData, setFormData] = useState({
    pickup_address: '',
    dropoff_address: '',
    pickup_lat: '',
    pickup_lng: '',
    dropoff_lat: '',
    dropoff_lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const rideData = {
        ...formData,
        pickup_lat: formData.pickup_lat || 0.3136,  
        pickup_lng: formData.pickup_lng || 32.5811,
        dropoff_lat: formData.dropoff_lat || 0.3163,
        dropoff_lng: formData.dropoff_lng || 32.5827,
      };

      const result = await RideService.requestRide(rideData);
      console.log('Ride requested successfully:', result);
      alert(`Ride requested successfully! Estimated fare: UGX ${result.fare}`);
      navigate('/my-rides');
    } catch (error) {
      console.error('Ride request error:', error);
      setError(error.detail || error.error || 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Request a Ride</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Location
            </label>
            <input
              type="text"
              name="pickup_address"
              value={formData.pickup_address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter pickup address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <input
              type="text"
              name="dropoff_address"
              value={formData.dropoff_address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter destination"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                Requesting Ride...
              </div>
            ) : (
              'Request Ride'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>1. Enter your pickup and destination</li>
            <li>2. We'll find nearby drivers</li>
            <li>3. Driver will accept your ride</li>
            <li>4. Track your driver in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RequestRide;