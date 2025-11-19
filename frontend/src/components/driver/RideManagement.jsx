
import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  User, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import DriverService from '../../services/driverApi';

const RideManagement = () => {
  const [availableRides, setAvailableRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchAvailableRides();
    fetchRideHistory();
  }, []);

  const fetchAvailableRides = async () => {
    try {
      const rides = await DriverService.getAvailableRides();
      setAvailableRides(rides);
    } catch (error) {
      setError(error.error || 'Failed to load available rides');
    }
  };

  const fetchRideHistory = async () => {
    try {
      const rides = await DriverService.getUserRides();
      setRideHistory(rides);
    } catch (error) {
      setError(error.error || 'Failed to load ride history');
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId) => {
    try {
      await DriverService.acceptRide(rideId);
      fetchAvailableRides(); 
    
    } catch (error) {
      setError(error.error || 'Failed to accept ride');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex space-x-4 border-b border-white/20">
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-4 px-1 border-b-2 font-medium transition-all ${
            activeTab === 'available'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Available Rides
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-1 border-b-2 font-medium transition-all ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Ride History
        </button>
      </div>

      {error && (
        <div className="bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      
      {activeTab === 'available' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Available Rides Near You</h2>
          
          {availableRides.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Navigation className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No available rides at the moment</p>
              <p className="text-white/40 text-sm">New ride requests will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableRides.map((ride) => (
                <div key={ride.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{ride.customer_name}</p>
                        <p className="text-white/60 text-sm">{ride.customer_phone}</p>
                      </div>
                    </div>
                    <span className="text-white font-bold text-lg">
                      Ksh {ride.fare}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3 text-white/80">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-sm">{ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-sm">{ride.dropoff_address}</span>
                    </div>
                  </div>

                  {ride.distance_to_pickup_km && (
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                      <Navigation className="w-4 h-4" />
                      {ride.distance_to_pickup_km} km away
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-white/60 text-sm">
                      Requested {new Date(ride.created_at).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => acceptRide(ride.id)}
                      className="bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 transition-colors font-semibold flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Ride
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Your Ride History</h2>
          
          {rideHistory.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No ride history yet</p>
              <p className="text-white/40 text-sm">Your completed rides will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rideHistory.map((ride) => (
                <div key={ride.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">{ride.customer_name}</p>
                      <p className="text-white/60 text-sm">{ride.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">Ksh {ride.fare}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ride.status)}`}>
                        {ride.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-white/80 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>{ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>{ride.dropoff_address}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-white/60 text-xs">
                      {new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString()}
                    </span>
                    {ride.status === 'completed' && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">5.0</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RideManagement;