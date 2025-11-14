import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Home, User, Phone, MessageCircle, MapPin, Navigation, DollarSign, Clock, Car, Bike, AlertCircle, Search } from 'lucide-react';
import RideService from '../services/ride';
import websocketService from '../services/webSocketService';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
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

const CustomerDash = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('economy');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // Nairobi coordinates
  const [error, setError] = useState('');
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  const chatEndRef = useRef(null);
  
  // WebSocket connection for customer
  useEffect(() => {
    const token = localStorage.getItem('token');
    const customerId = localStorage.getItem('user_id'); // Assuming you store user ID
    
    if (customerId && token) {
      websocketService.connect('customer', customerId, token);
      
      // Set up message handlers
      websocketService.onMessage('ride_status_update', handleRideStatusUpdate);
      websocketService.onMessage('location_update', handleDriverLocationUpdate);
      websocketService.onMessage('chat_message', handleChatMessage);
      websocketService.onMessage('new_ride_request', handleNewRideRequest);
    }

    return () => {
      websocketService.disconnect();
      websocketService.removeMessageHandler('ride_status_update');
      websocketService.removeMessageHandler('location_update');
      websocketService.removeMessageHandler('chat_message');
      websocketService.removeMessageHandler('new_ride_request');
    };
  }, []);

  // Handle ride status updates
  const handleRideStatusUpdate = (data) => {
    setRideStatus(data.status);
    
    if (data.status === 'accepted') {
      // Fetch driver info when ride is accepted
      fetchDriverInfo(data.driver_id);
    }
    
    if (data.status === 'completed' || data.status === 'cancelled') {
      setActiveRide(null);
      setDriverLocation(null);
      setDriverInfo(null);
    }
  };

  // Handle driver location updates
  const handleDriverLocationUpdate = (data) => {
    setDriverLocation({ lat: data.lat, lng: data.lng });
  };

  // Handle chat messages
  const handleChatMessage = (data) => {
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      message: data.message,
      sender: 'driver',
      timestamp: data.timestamp,
      sender_name: data.sender_name
    }]);
  };

  const handleNewRideRequest = (data) => {
    // This would be for the driver side, but keeping for consistency
    console.log('New ride request:', data);
  };

  const fetchDriverInfo = async (driverId) => {
    try {
      const driverData = await RideService.getDriverInfo(driverId);
      setDriverInfo(driverData);
    } catch (error) {
      console.error('Error fetching driver info:', error);
    }
  };

  // Update requestRide function to handle WebSocket after ride creation
  const requestRide = async () => {
    if (!fareEstimate) {
      setError('Please calculate a route first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rideData = {
        pickup_address: pickup,
        dropoff_address: dropoff,
        pickup_lat: pickupCoords[0],
        pickup_lng: pickupCoords[1],
        dropoff_lat: dropoffCoords[0],
        dropoff_lng: dropoffCoords[1],
        vehicle_type: selectedVehicle,
        estimated_fare: fareEstimate.total
      };

      const result = await RideService.requestRide(rideData);
      
      // Set active ride
      setActiveRide(result);
      setRideStatus('requested');
      
      alert(`Ride requested successfully! Your driver will be notified. Fare: KSH ${result.fare}`);
      
    } catch (error) {
      console.error('Ride request error:', error);
      setError('Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeRide) return;

    const messageData = {
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket
    websocketService.sendMessage('chat_message', messageData);

    // Add to local messages
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      message: newMessage,
      sender: 'customer',
      timestamp: messageData.timestamp,
      sender_name: 'You'
    }]);

    setNewMessage('');
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);


  // Autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const mapRef = useRef();
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target)) {
        setShowPickupSuggestions(false);
      }
      if (dropoffRef.current && !dropoffRef.current.contains(event.target)) {
        setShowDropoffSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete 
  const searchAddress = async (query, type) => {
    if (query.length < 3) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const suggestions = await RideService.autocompleteAddress(query);
      
      if (type === 'pickup') {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } else {
        setDropoffSuggestions(suggestions);
        setShowDropoffSuggestions(true);
      }
    } catch (error) {
      console.error('Autocomplete search error:', error);
      
      if (type === 'pickup') {
        setShowPickupSuggestions(false);
      } else {
        setShowDropoffSuggestions(false);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // address selection from suggestions
  const handleAddressSelect = async (suggestion, type) => {
    try {
      const placeDetails = await RideService.getPlaceDetails(suggestion.place_id);
      
      const coords = [placeDetails.lat, placeDetails.lng];
      
      if (type === 'pickup') {
        setPickup(placeDetails.address || suggestion.description);
        setPickupCoords(coords);
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
        setMapCenter(coords);
      } else {
        setDropoff(placeDetails.address || suggestion.description);
        setDropoffCoords(coords);
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      
      if (type === 'pickup') {
        geocodeAddress(suggestion.description, 'pickup');
      } else {
        geocodeAddress(suggestion.description, 'dropoff');
      }
    }
  };


  const handleAddressInput = (value, type) => {
    if (type === 'pickup') {
      setPickup(value);
      searchAddress(value, 'pickup');
    } else {
      setDropoff(value);
      searchAddress(value, 'dropoff');
    }
  };

  // Fare calculation rates (KSH per km)
  const fareRates = {
    economy: {
      base: 100,
      perKm: 50,
      perMin: 10,
      name: 'Economy',
      icon: '🚗',
      multiplier: 1
    },
    boda: {
      base: 50,
      perKm: 30,
      perMin: 5,
      name: 'Boda',
      icon: '🏍️',
      multiplier: 0.7
    },
    premium: {
      base: 200,
      perKm: 80,
      perMin: 15,
      name: 'Premium',
      icon: '🚙',
      multiplier: 1.5
    }
  };

  //  current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(pos);
          setMapCenter(pos);
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  
  const geocodeAddress = async (address, type) => {
    try {
      const response = await RideService.geocodeAddress({ address });
      const coords = [response.lat, response.lng];
      
      if (type === 'pickup') {
        setPickupCoords(coords);
        setPickup(response.display_name || address);
      } else {
        setDropoffCoords(coords);
        setDropoff(response.display_name || address);
      }
      
      return coords;
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Could not find location. Please try a different address.');
      return null;
    }
  };

  // Calculate route backend
  const calculateRoute = async () => {
    if (!pickupCoords || !dropoffCoords) {
      setError('Please select both pickup and dropoff locations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rideData = {
        pickup_address: pickup,
        dropoff_address: dropoff,
        pickup_lat: pickupCoords[0],
        pickup_lng: pickupCoords[1],
        dropoff_lat: dropoffCoords[0],
        dropoff_lng: dropoffCoords[1],
      };

      const result = await RideService.requestRide(rideData);
      
      setDistance(result.distance_km);
      setDuration(result.duration_min);
      setRouteGeometry(result.route_polyline || result.route_geometry);
      
      // Calculate fare based on distance
      calculateFare(result.distance_km, result.duration_min);

    } catch (error) {
      console.error('Route calculation error:', error);
      setError('Could not calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = (distanceKm, durationMin) => {
    const rates = fareRates[selectedVehicle];
    const fare = rates.base + (distanceKm * rates.perKm) + (durationMin * rates.perMin);
    
    // surge pricing during peak hours
    const hour = new Date().getHours();
    let surgeMultiplier = 1;
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      surgeMultiplier = 1.2;
    }

    const finalFare = Math.round(fare * surgeMultiplier);
    
    setFareEstimate({
      base: rates.base,
      distance: Math.round(distanceKm * rates.perKm),
      time: Math.round(durationMin * rates.perMin),
      surge: surgeMultiplier > 1 ? Math.round((fare * (surgeMultiplier - 1))) : 0,
      total: finalFare,
      surgeMultiplier
    });
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setPickupCoords(currentLocation);
      setMapCenter(currentLocation);
      setPickup('Current Location');
      setError('');
    }
  };

  // Map controller component
  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (pickupCoords && dropoffCoords) {
        const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
        map.fitBounds(bounds, { padding: [20, 20] });
      } else if (pickupCoords) {
        map.setView(pickupCoords, 15);
      } else if (currentLocation) {
        map.setView(currentLocation, 15);
      }
    }, [map, pickupCoords, dropoffCoords, currentLocation]);

    return null;
  };

  // Polyline decoder for Google Maps
  const decodePolyline = (polyline) => {
    if (!polyline) return [];
    
    
    if (Array.isArray(polyline) && Array.isArray(polyline[0])) {
      return polyline;
    }
    
    
    let index = 0;
    const len = polyline.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push([lat * 1e-5, lng * 1e-5]);
    }

    return coordinates;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
  
  <div className="flex justify-between items-center mb-2">
    <h1 className="text-3xl font-bold">Request a Ride</h1>
    
    <button 
      onClick={() => window.location.href = '/'}
      className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
    >
      <Home size={20} />
      Home
    </button>
  </div>
  <p className="text-blue-100">Enter your destination and get instant fare estimates</p>
</div>

          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            <div className="lg:col-span-1 p-6 space-y-6 border-r border-gray-200">
              
              <div ref={pickupRef} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-green-600" />
                  Pickup Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => handleAddressInput(e.target.value, 'pickup')}
                    onFocus={() => pickup.length >= 3 && setShowPickupSuggestions(true)}
                    placeholder="Enter pickup address"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none pr-20"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={useCurrentLocation}
                      className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition"
                      title="Use current location"
                    >
                      <Navigation size={16} />
                    </button>
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Search className="text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  {/* Pickup Suggestions Dropdown */}
                  {showPickupSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="p-3 text-gray-500 text-center">Loading suggestions...</div>
                      ) : pickupSuggestions.length > 0 ? (
                        pickupSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleAddressSelect(suggestion, 'pickup')}
                          >
                            <div className="flex items-start">
                              <MapPin className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" size={16} />
                              <span className="text-sm text-gray-700">{suggestion.description}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">No suggestions found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dropoff Location with Autocomplete */}
              <div ref={dropoffRef} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-red-600" />
                  Dropoff Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => handleAddressInput(e.target.value, 'dropoff')}
                    onFocus={() => dropoff.length >= 3 && setShowDropoffSuggestions(true)}
                    placeholder="Enter destination address"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none pr-12"
                  />
                  <div className="absolute right-2 top-2">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Search className="text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  {/* Dropoff Suggestions Dropdown */}
                  {showDropoffSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="p-3 text-gray-500 text-center">Loading suggestions...</div>
                      ) : dropoffSuggestions.length > 0 ? (
                        dropoffSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.place_id}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleAddressSelect(suggestion, 'dropoff')}
                          >
                            <div className="flex items-start">
                              <MapPin className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" size={16} />
                              <span className="text-sm text-gray-700">{suggestion.description}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">No suggestions found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Calculate Route Button */}
              <button
                onClick={calculateRoute}
                disabled={!pickupCoords || !dropoffCoords || loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                  pickupCoords && dropoffCoords && !loading
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-lg'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Calculating...' : 'Calculate Route & Fare'}
              </button>

              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Choose a ride
                </label>
                <div className="space-y-2">
                  {Object.entries(fareRates).map(([key, rate]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedVehicle(key)}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedVehicle === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{rate.icon}</span>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">{rate.name}</p>
                            <p className="text-xs text-gray-500">
                              Base: KSH {rate.base.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {selectedVehicle === key && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Info */}
              {distance && duration && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-800 mb-3">Trip Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Distance</span>
                      <span className="font-bold text-gray-800">
                        {distance.toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Duration</span>
                      <span className="font-bold text-gray-800">
                        {Math.round(duration)} mins
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fare Breakdown */}
              {fareEstimate && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-green-600" />
                    Fare Estimate
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Fare</span>
                      <span className="text-gray-800">
                        KSH {fareEstimate.base.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Distance Charge</span>
                      <span className="text-gray-800">
                        KSH {fareEstimate.distance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time Charge</span>
                      <span className="text-gray-800">
                        KSH {fareEstimate.time.toLocaleString()}
                      </span>
                    </div>
                    {fareEstimate.surge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600 flex items-center gap-1">
                          <AlertCircle size={14} />
                          Surge Pricing ({fareEstimate.surgeMultiplier}x)
                        </span>
                        <span className="text-orange-600">
                          +KSH {fareEstimate.surge.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="border-t-2 border-green-300 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-800">Total Fare</span>
                        <span className="font-bold text-green-600 text-xl">
                          KSH {fareEstimate.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              <button
                onClick={requestRide}
                disabled={!fareEstimate || loading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                  fareEstimate && !loading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Requesting...' : (fareEstimate ? 'Request Ride' : 'Enter Locations')}
              </button>
            </div>

            
            <div className="lg:col-span-2 relative" style={{ minHeight: '600px' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: '600px' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController />
                
              
                {currentLocation && (
                  <Marker 
                    position={currentLocation}
                    icon={createCustomIcon('#4F46E5', 'Y')}
                  >
                    <Popup>Your Current Location</Popup>
                  </Marker>
                )}
                
                
                {pickupCoords && (
                  <Marker 
                    position={pickupCoords}
                    icon={createCustomIcon('#10B981', 'A')}
                  >
                    <Popup>Pickup Location</Popup>
                  </Marker>
                )}
                
                
                {dropoffCoords && (
                  <Marker 
                    position={dropoffCoords}
                    icon={createCustomIcon('#EF4444', 'B')}
                  >
                    <Popup>Dropoff Location</Popup>
                  </Marker>
                )}
                
                
                {routeGeometry && (
                  <Polyline
                    positions={decodePolyline(routeGeometry)}
                    color="#3B82F6"
                    weight={5}
                    opacity={0.8}
                  />
                )}
              </MapContainer>
              
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Calculating route...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default CustomerDash;