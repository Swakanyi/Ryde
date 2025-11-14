import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  DollarSign, 
  Clock, 
  MessageCircle,
  Navigation,
  User,
  Shield,
  Star,
  AlertCircle,
  Bell
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverService from '../../services/driverApi';
import websocketService from '../../services/webSocketService';
import RideManagement from './RideManagement';
import Earnings from './Earnings';
import VehicleInfo from './VehicleInfo';


const createCustomIcon = (color, letter) => {
  return L.divIcon({
    html: `
      <div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
        <span style="color: white; font-weight: bold; font-size: 12px;">${letter}</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const DriverDash = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRideNotification, setNewRideNotification] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    setupWebSocket();
    startLocationTracking();
  }, []);

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    const driverId = localStorage.getItem('user_id');
    
    if (driverId && token) {
      websocketService.connect('driver', driverId, token);
      
      // Set up message handlers
      websocketService.onMessage('new_ride_request', handleNewRideRequest);
      websocketService.onMessage('ride_status_update', handleRideStatusUpdate);
      websocketService.onMessage('chat_message', handleChatMessage);
    }
  };

  const handleNewRideRequest = (data) => {
    setNewRideNotification(data);
    
    // Auto-hide notification after 30 seconds
    setTimeout(() => {
      setNewRideNotification(null);
    }, 30000);
  };

  const handleRideStatusUpdate = (data) => {
    // Refresh dashboard when ride status changes
    fetchDashboardData();
  };

  const handleChatMessage = (data) => {
    // Handle incoming chat messages from customer
    console.log('New chat message:', data);
    // You could show a notification or update chat UI
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          updateDriverLocation(pos);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Watch position for updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          
          // Only update if driver is online
          if (dashboardData?.driver_status?.is_online) {
            updateDriverLocation(pos);
          }
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  };

  const updateDriverLocation = async (location) => {
    try {
      await DriverService.updateDriverLocation({
        lat: location.lat,
        lng: location.lng,
        is_online: dashboardData?.driver_status?.is_online || false
      });

      // Broadcast location via WebSocket if there's an active ride
      if (dashboardData?.current_ride) {
        websocketService.sendMessage('location_update', {
          ride_id: dashboardData.current_ride.id,
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await DriverService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error.error || error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async (isOnline) => {
    try {
      await DriverService.toggleOnlineStatus(isOnline);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      setError(error.error || 'Failed to update status');
    }
  };

  const acceptRide = async (rideId) => {
    try {
      await DriverService.acceptRide(rideId);
      setNewRideNotification(null);
      fetchDashboardData(); // Refresh to show active ride
      
      // Notify customer via WebSocket
      websocketService.sendMessage('ride_status_update', {
        ride_id: rideId,
        status: 'accepted',
        timestamp: new Date().toISOString(),
        driver_id: localStorage.getItem('user_id')
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const declineRide = async (rideId) => {
    try {
      await DriverService.declineRide(rideId);
      setNewRideNotification(null);
    } catch (error) {
      console.error('Error declining ride:', error);
    }
  };

  // Update the ride action functions to use WebSocket
  const handleRideAction = async (rideId, action) => {
    try {
      let newStatus = '';
      
      switch (action) {
        case 'arrived':
          await DriverService.updateRideStatus(rideId, 'driver_arrived');
          newStatus = 'driver_arrived';
          break;
        case 'start':
          await DriverService.startRide(rideId);
          newStatus = 'in_progress';
          break;
        case 'complete':
          await DriverService.completeRide(rideId);
          newStatus = 'completed';
          break;
        default:
          break;
      }

      // Notify customer via WebSocket
      if (newStatus) {
        websocketService.sendMessage('ride_status_update', {
          ride_id: rideId,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      }
      
      fetchDashboardData(); // Refresh dashboard
    } catch (error) {
      console.error('Ride action error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && (error.includes('pending approval') || error.includes('not approved'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
          <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Account Under Review</h2>
          <p className="text-white/80 mb-2">Status: {dashboardData?.approval_status || 'Pending'}</p>
          {dashboardData?.rejection_reason && (
            <p className="text-white/60 text-sm mb-6">Reason: {dashboardData.rejection_reason}</p>
          )}
          <p className="text-white/70">Please wait for admin approval to start driving.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Dashboard</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
      {/* New Ride Notification */}
      {newRideNotification && (
        <div className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl p-6 max-w-sm z-50 animate-in slide-in-from-right">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-6 h-6 text-yellow-500" />
            <h3 className="font-bold text-gray-800">New Ride Request!</h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{newRideNotification.pickup_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>{newRideNotification.dropoff_address}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="font-bold text-lg text-gray-800">
                Ksh {newRideNotification.fare}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => declineRide(newRideNotification.id)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Decline
                </button>
                <button
                  onClick={() => acceptRide(newRideNotification.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <Car className="w-6 h-6 text-white -rotate-12" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                Ryde Driver
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Online Status Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-white/80 text-sm">Status:</span>
                <button
                  onClick={() => toggleOnlineStatus(!dashboardData?.driver_status?.is_online)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    dashboardData?.driver_status?.is_online 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                      : 'bg-gray-600 text-white/70'
                  }`}
                >
                  {dashboardData?.driver_status?.is_online ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>

              {/* Driver Info */}
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 border border-white/20">
                <User className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">
                  {dashboardData?.user?.first_name} {dashboardData?.user?.last_name}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Car },
              { id: 'rides', label: 'Rides', icon: Navigation },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'vehicle', label: 'Vehicle', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView 
            data={dashboardData} 
            onStatusUpdate={fetchDashboardData}
            onRideAction={handleRideAction}
            currentLocation={currentLocation}
          />
        )}
        {activeTab === 'rides' && <RideManagement />}
        {activeTab === 'earnings' && <Earnings />}
        {activeTab === 'vehicle' && <VehicleInfo />}
      </main>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ data, onStatusUpdate, onRideAction, currentLocation }) => {
  const stats = [
    {
      icon: DollarSign,
      label: "Today's Earnings",
      value: `Ksh ${data?.today_stats?.total_earnings || 0}`,
      subtitle: `${data?.today_stats?.completed_rides || 0} rides`
    },
    {
      icon: Clock,
      label: "Weekly Earnings",
      value: `Ksh ${data?.weekly_stats?.total_earnings || 0}`,
      subtitle: `${data?.weekly_stats?.completed_rides || 0} rides`
    },
    {
      icon: Star,
      label: "Rating",
      value: "4.9",
      subtitle: "Excellent"
    },
    {
      icon: MapPin,
      label: "Current Location",
      value: currentLocation ? "Active" : "Not set",
      subtitle: currentLocation ? "Tracking enabled" : "Update location"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">{stat.label}</p>
                <p className="text-white text-xl font-bold">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Ride & Quick Actions Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Ride */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            Current Ride
          </h3>
          
          {data?.current_ride ? (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-semibold">
                      {data.current_ride.customer_name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {data.current_ride.customer_phone}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.current_ride.status === 'accepted' ? 'bg-yellow-500/20 text-yellow-300' :
                    data.current_ride.status === 'driver_arrived' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {data.current_ride.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{data.current_ride.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>{data.current_ride.dropoff_address}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <span className="text-white font-bold text-lg">
                    Ksh {data.current_ride.fare}
                  </span>
                  
                  {/* Ride Action Buttons */}
                  <div className="flex gap-2">
                    {data.current_ride.status === 'accepted' && (
                      <button 
                        onClick={() => onRideAction(data.current_ride.id, 'arrived')}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        I've Arrived
                      </button>
                    )}
                    {data.current_ride.status === 'driver_arrived' && (
                      <button 
                        onClick={() => onRideAction(data.current_ride.id, 'start')}
                        className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                      >
                        Start Ride
                      </button>
                    )}
                    {data.current_ride.status === 'in_progress' && (
                      <button 
                        onClick={() => onRideAction(data.current_ride.id, 'complete')}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No active ride</p>
              <p className="text-white/40 text-sm">You'll see ride details here when you accept a ride</p>
            </div>
          )}
        </div>

{/* Map view */}
<div className="col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
  <h3 className="text-lg font-semibold text-white mb-4">Navigation Map</h3>
  <div style={{ height: '400px' }}>
    <MapContainer center={currentLocation || [-1.2921, 36.8219]} zoom={13}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Driver's current location */}
      {currentLocation && (
        <Marker position={currentLocation} icon={createCustomIcon('#10B981', 'D')}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      
      {/* Show pickup/dropoff if there's an active ride */}
      {data?.current_ride && (
        <>
          <Marker 
            position={[data.current_ride.pickup_lat, data.current_ride.pickup_lng]} 
            icon={createCustomIcon('#3B82F6', 'P')}
          >
            <Popup>Pickup Location</Popup>
          </Marker>
          <Marker 
            position={[data.current_ride.dropoff_lat, data.current_ride.dropoff_lng]} 
            icon={createCustomIcon('#EF4444', 'D')}
          >
            <Popup>Dropoff Location</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  </div>
</div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.href = '/driver/location'}
              className="bg-emerald-500/20 text-emerald-300 p-4 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
            >
              <MapPin className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Update Location</span>
            </button>
            <button className="bg-blue-500/20 text-blue-300 p-4 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all">
              <MessageCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Messages</span>
            </button>
            <button 
              onClick={() => window.location.href = '/driver/earnings'}
              className="bg-yellow-500/20 text-yellow-300 p-4 rounded-xl border border-yellow-500/30 hover:bg-yellow-500/30 transition-all"
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Earnings</span>
            </button>
            <button className="bg-purple-500/20 text-purple-300 p-4 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-all">
              <User className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDash;