import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { 
  Home, User, Phone, MessageCircle, MapPin, Navigation, DollarSign, Shield,
  Clock, Car, Bike, AlertCircle, Search, Star, Package, Bell, X, Edit3, Save, Mail, CheckCircle,
  CreditCard, Smartphone, Info, Upload, Download, Mic, Square, Bot 
} from 'lucide-react';
import RideService from '../services/ride';
import websocketService from '../services/websocketService';
import UserService from '../services/user';
import ChatService from '../services/chatService';
import CustomerService from '../services/customerService'; 
import VoiceAssistant from '../hooks/voiceAssistant';
import 'leaflet/dist/leaflet.css';

//default markers in react-leaflet
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


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              There was an error in this component. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const NotificationBell = ({ notifications, unreadCount, onMarkAsRead, onClearNotification, onMarkAllAsRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="relative">
      
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-white/80 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

     
      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => onMarkAsRead(notification.id)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {notification.type === 'ride_requested' && (
                        <Car className="w-4 h-4 text-green-500" />
                      )}
                      {notification.type === 'ride_accepted' && (
                        <User className="w-4 h-4 text-blue-500" />
                      )}
                      {notification.type === 'driver_arrived' && (
                        <MapPin className="w-4 h-4 text-yellow-500" />
                      )}
                      {notification.type === 'ride_completed' && (
                        <Star className="w-4 h-4 text-emerald-500" />
                      )}
                      {notification.type === 'chat_message' && (
                        <MessageCircle className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="font-semibold text-gray-800 text-sm">
                        {notification.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const AlertSystem = ({ alerts, onRemoveAlert }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[1000] space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-xl border-l-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
            alert.type === 'error' 
              ? 'bg-red-500/20 border-l-red-400 text-red-100' 
              : alert.type === 'warning'
              ? 'bg-yellow-500/20 border-l-yellow-400 text-yellow-100'
              : alert.type === 'success'
              ? 'bg-green-500/20 border-l-green-400 text-green-100'
              : 'bg-blue-500/20 border-l-blue-400 text-blue-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-1">
                <span className="font-semibold text-sm">{alert.title}</span>
              </div>
              <p className="text-sm opacity-90">{alert.message}</p>
            </div>
            <button
              onClick={() => onRemoveAlert(alert.id)}
              className="ml-3 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


const ChatModal = ({ showChat, onClose, chatMessages, newMessage, onMessageChange, onSendMessage, driverInfo, currentUserType }) => {
  const chatEndRef = useRef();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (!showChat) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-96 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">
              {currentUserType === 'customer' ? 'Chat with Driver' : 'Chat with Customer'}
            </h3>
            {driverInfo && currentUserType === 'customer' && (
              <p className="text-sm text-gray-600">
                {driverInfo.first_name} {driverInfo.last_name}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 ${msg.isCurrentUser ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-2xl max-w-xs ${
                    msg.isCurrentUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.isCurrentUser ? 'You' : msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={onMessageChange}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={onSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};


const EmergencyContactModal = ({ show, onClose, contacts }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-800">Emergency Contacts</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Quickly contact emergency services or your emergency contacts
          </p>
        </div>
        
        <div className="p-6 space-y-4">
         
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">Emergency Services</h4>
            <div className="space-y-2">
              <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                Call Emergency Services (911)
              </button>
            </div>
          </div>

          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Your Emergency Contacts</h4>
            {contacts.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No emergency contacts set up</p>
                <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                  Add Emergency Contact
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-800">{contact.name}</p>
                      <p className="text-gray-600 text-sm">{contact.phone}</p>
                      <p className="text-gray-500 text-xs">{contact.relationship}</p>
                    </div>
                    <button className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

         
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
            <button className="bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Share Location
            </button>
            <button className="bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Safety Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CourierModal = ({ show, onClose, onRequestCourier, hasValidLocations, pickup, dropoff }) => {
  const [packageDetails, setPackageDetails] = useState({
    package_description: '',
    package_size: 'small',
    recipient_name: '',
    recipient_phone: '',
    delivery_instructions: '',
    selected_vehicle: 'courier_bike' 
  });

  const packageSizes = [
    { value: 'small', label: 'Small Package (up to 1kg)', suitable_vehicles: ['courier_bike', 'courier_car'] },
    { value: 'medium', label: 'Medium Package (1-5kg)', suitable_vehicles: ['courier_bike', 'courier_car'] },
    { value: 'large', label: 'Large Package (5-15kg)', suitable_vehicles: ['courier_car'] },
    { value: 'extra_large', label: 'Extra Large (15kg+)', suitable_vehicles: ['courier_car'] },
    { value: 'document', label: 'Documents', suitable_vehicles: ['courier_bike', 'courier_car'] }
  ];

  const courierVehicles = [
    {
      id: 'courier_bike',
      name: 'Courier Bike',
      icon: '🏍️',
      description: 'Fast delivery for small packages',
      max_weight: 'Up to 5kg',
      base_price: 60,
      suitable_for: ['document', 'small', 'medium']
    },
    {
      id: 'courier_car', 
      name: 'Courier Car',
      icon: '🚗',
      description: 'Larger vehicles for big packages',
      max_weight: 'Up to 25kg',
      base_price: 120,
      suitable_for: ['document', 'small', 'medium', 'large', 'extra_large']
    }
  ];

  
  const availableVehicles = courierVehicles.filter(vehicle => 
    vehicle.suitable_for.includes(packageDetails.package_size)
  );

  const handleSubmit = () => {
    if (!hasValidLocations) {
      alert('Please select pickup and dropoff locations first on the main ride tab');
      return;
    }

    if (!packageDetails.package_description || !packageDetails.recipient_name || !packageDetails.recipient_phone) {
      alert('Please fill in package description, recipient name and phone');
      return;
    }

    onRequestCourier(packageDetails);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-800">Send a Package</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Fill in package details for delivery
          </p>
        </div>

        <div className="p-6 space-y-4">
         
          {!hasValidLocations ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Locations Required</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please select pickup and dropoff locations on the main ride tab first
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Locations Set</span>
              </div>
              <div className="text-green-700 text-sm mt-1 space-y-1">
                <p><strong>From:</strong> {pickup}</p>
                <p><strong>To:</strong> {dropoff}</p>
              </div>
            </div>
          )}

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you sending? *
            </label>
            <input
              type="text"
              value={packageDetails.package_description}
              onChange={(e) => setPackageDetails(prev => ({ 
                ...prev, 
                package_description: e.target.value 
              }))}
              placeholder="e.g., Documents, Electronics, Food, Clothes, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Size *
            </label>
            <select
              value={packageDetails.package_size}
              onChange={(e) => setPackageDetails(prev => ({ 
                ...prev, 
                package_size: e.target.value,
                
                selected_vehicle: availableVehicles.some(v => v.id === prev.selected_vehicle) 
                  ? prev.selected_vehicle 
                  : availableVehicles[0]?.id || ''
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {packageSizes.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Courier Type
            </label>
            <div className="space-y-2">
              {availableVehicles.map(vehicle => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setPackageDetails(prev => ({ 
                    ...prev, 
                    selected_vehicle: vehicle.id 
                  }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    packageDetails.selected_vehicle === vehicle.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vehicle.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{vehicle.name}</p>
                        <p className="text-xs text-gray-600">{vehicle.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Max weight: {vehicle.max_weight} • Base: KSH {vehicle.base_price}
                        </p>
                      </div>
                    </div>
                    {packageDetails.selected_vehicle === vehicle.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Recipient Information</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={packageDetails.recipient_name}
                  onChange={(e) => setPackageDetails(prev => ({ 
                    ...prev, 
                    recipient_name: e.target.value 
                  }))}
                  placeholder="Full name of recipient"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Phone *
                </label>
                <input
                  type="tel"
                  value={packageDetails.recipient_phone}
                  onChange={(e) => setPackageDetails(prev => ({ 
                    ...prev, 
                    recipient_phone: e.target.value 
                  }))}
                  placeholder="07XX XXX XXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Instructions
            </label>
            <textarea
              value={packageDetails.delivery_instructions}
              onChange={(e) => setPackageDetails(prev => ({ 
                ...prev, 
                delivery_instructions: e.target.value 
              }))}
              placeholder="Special instructions for the driver (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasValidLocations || availableVehicles.length === 0}
            className={`flex-1 py-3 rounded-lg transition-colors font-medium ${
              hasValidLocations && availableVehicles.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Request Courier
          </button>
        </div>
      </div>
    </div>
  );
};


const ScheduleRideModal = ({ show, onClose, onScheduleRide }) => {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [schedulePickup, setSchedulePickup] = useState('');
  const [scheduleDropoff, setScheduleDropoff] = useState('');

  if (!show) return null;

  const handleSubmit = () => {
    if (!scheduleDate || !scheduleTime || !schedulePickup || !scheduleDropoff) {
      alert('Please fill in all fields');
      return;
    }

    const scheduledRide = {
      id: Date.now(),
      date: scheduleDate,
      time: scheduleTime,
      pickup: schedulePickup,
      dropoff: scheduleDropoff,
      status: 'scheduled'
    };

    onScheduleRide(scheduledRide);
    onClose();
    
    
    setScheduleDate('');
    setScheduleTime('');
    setSchedulePickup('');
    setScheduleDropoff('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-800">Schedule a Ride</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Schedule your ride for later
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
            <input
              type="text"
              value={schedulePickup}
              onChange={(e) => setSchedulePickup(e.target.value)}
              placeholder="Enter pickup address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Location</label>
            <input
              type="text"
              value={scheduleDropoff}
              onChange={(e) => setScheduleDropoff(e.target.value)}
              placeholder="Enter destination address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Schedule Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




const ShareRideModal = ({ show, onClose, activeRide }) => {
  const [shareUrl, setShareUrl] = useState('');

  if (!show) return null;

  const generateShareUrl = () => {
    const url = `${window.location.origin}/share/ride/${activeRide?.id || 'demo'}`;
    setShareUrl(url);
    return url;
  };

  const copyToClipboard = async () => {
    const url = shareUrl || generateShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      alert('Share URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaWhatsApp = () => {
    const url = shareUrl || generateShareUrl();
    const text = `Track my ride: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-bold text-gray-800">Share Ride</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Share your ride details with friends and family
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {activeRide ? (
            <>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Active Ride</h4>
                <p className="text-green-700 text-sm">
                  Share your current ride status and location
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl || generateShareUrl()}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No active ride to share</p>
              <p className="text-gray-400 text-sm">
                Start a ride to share your trip details with others
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={shareViaWhatsApp}
              disabled={!activeRide}
              className={`py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                activeRide 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!activeRide}
              className={`py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                activeRide 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-sm">📋</span>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodsModal = ({ show, onClose, paymentDetails, onPaymentChange, onSave }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-800">Payment Methods</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Manage your payment methods
          </p>
        </div>
        
        <div className="p-6 space-y-4">
         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</label>
            <div className="space-y-3">
              <button
                onClick={() => onPaymentChange('mpesa')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  paymentDetails.method === 'mpesa'
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <Smartphone className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">M-Pesa</p>
                  <p className="text-xs text-gray-600">Pay with Mobile Money</p>
                </div>
                {paymentDetails.method === 'mpesa' && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border border-white ml-auto">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => onPaymentChange('visa')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  paymentDetails.method === 'visa'
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Visa/MasterCard</p>
                  <p className="text-xs text-gray-600">Pay with Credit/Debit Card</p>
                </div>
                {paymentDetails.method === 'visa' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white ml-auto">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            </div>
          </div>

         
          {paymentDetails.method === 'mpesa' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">M-Pesa Number</label>
              <input
                type="tel"
                value={paymentDetails.mpesaNumber}
                onChange={(e) => onPaymentChange('mpesa', e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500">
                You'll receive a prompt to enter your M-Pesa PIN when paying
              </p>
            </div>
          )}

          {paymentDetails.method === 'visa' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => onPaymentChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => onPaymentChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    value={paymentDetails.cvv}
                    onChange={(e) => onPaymentChange('cvv', e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder Name</label>
                <input
                  type="text"
                  value={paymentDetails.cardHolder}
                  onChange={(e) => onPaymentChange('cardHolder', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Save Payment Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const ChatHistoryModal = ({ show, onClose, chatHistory }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-96 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-bold text-gray-800">Chat History</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Your conversation history with drivers
          </p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No chat history yet</p>
              <p className="text-sm">Your conversations with drivers will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{chat.driverName}</p>
                      <p className="text-sm text-gray-600">{chat.rideId}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {chat.messages.slice(-3).map((msg, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          msg.sender === 'customer' 
                            ? 'bg-blue-100 text-blue-800 ml-8' 
                            : 'bg-gray-100 text-gray-800 mr-8'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {chat.messages.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ... and {chat.messages.length - 3} more messages
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]);
  const [error, setError] = useState('');
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('ride');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rideHistory, setRideHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [allVehicleFares, setAllVehicleFares] = useState({});
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [packageType, setPackageType] = useState('send'); 
  const [packageDescription, setPackageDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [packageSize, setPackageSize] = useState('medium');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
const [voiceCommandResult, setVoiceCommandResult] = useState(null);
  

  const addAlert = (alert) => {
    const newAlert = {
      id: Date.now(),
      ...alert,
      type: alert.type || 'error',
      autoClose: alert.autoClose !== false,
      duration: alert.duration || 5000
    };

    setAlerts(prev => [...prev, newAlert]);

    if (newAlert.autoClose) {
      setTimeout(() => {
        removeAlert(newAlert.id);
      }, newAlert.duration);
    }
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };
  const [showAlerts, setShowAlerts] = useState(false);

 
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [quickActions, setQuickActions] = useState([
  {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    icon: Shield,
    color: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-300',
    action: () => handleEmergencyContact()
  },
  {
    id: 'schedule-ride',
    title: 'Schedule Ride',
    icon: Clock,
    color: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    action: () => handleScheduleRide()
  },
  {
    id: 'share-ride',
    title: 'Share Ride',
    icon: User,
    color: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-300',
    action: () => handleShareRide()
  },
  {
    id: 'ride-history',
    title: 'Ride History',
    icon: Navigation,
    color: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    action: () => handleRideHistory()
  },
  {
    id: 'payment-methods',
    title: 'Payment',
    icon: DollarSign,
    color: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-300',
    action: () => handlePaymentMethods()
  },
  {
    id: 'chat-history',
    title: 'Chat History',
    icon: MessageCircle,
    color: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-300',
    action: () => handleChatHistory()
  }
]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentDetails, setPaymentDetails] = useState({
  method: 'mpesa',
  mpesa_number: '',
  card_number: '',
  expiry_date: '',
  cvv: '',
  card_holder: ''
});

const [showChatHistory, setShowChatHistory] = useState(false);
const [allChatHistory, setAllChatHistory] = useState([]);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const chatEndRef = useRef();
  const mapRef = useRef();
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

   const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: sessionStorage.getItem('customer_name')?.split(' ')[0] || 'Customer',
    lastName: sessionStorage.getItem('customer_name')?.split(' ')[1] || '',
    email: 'customer@example.com',
    phone: '+254 712 345 678',
    paymentMethod: 'mpesa' 
  });
  
  const [editPersonalInfo, setEditPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentMethod: 'mpesa'
  });


const handleEditPersonalInfo = () => {
  setEditPersonalInfo({ ...personalInfo });
  setIsEditingPersonalInfo(true);
};

const handleSavePersonalInfo = async () => {
  try {
    setLoading(true);
    
    // Validate required fields
    if (!editPersonalInfo.firstName.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'First name is required',
        data: { field: 'firstName' }
      });
      return;
    }

    if (!editPersonalInfo.email.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required',
        data: { field: 'email' }
      });
      return;
    }

    
    const profileData = {
      first_name: editPersonalInfo.firstName.trim(),
      last_name: editPersonalInfo.lastName.trim(),
      email: editPersonalInfo.email.trim(),
      phone_number: editPersonalInfo.phone.trim()
    };

    console.log('🟡 [Profile] Attempting to update profile:', profileData);

    const response = await UserService.updateProfile(profileData);
    
    console.log('✅ [Profile] Update response:', response);
    
    
    let userData;
    if (response.user) {
      
      userData = response.user;
    } else if (response.first_name) {
     
      userData = response;
    } else {
      
      userData = profileData;
    }
    
    const updatedProfile = {
      firstName: userData.first_name || editPersonalInfo.firstName,
      lastName: userData.last_name || editPersonalInfo.lastName,
      email: userData.email || editPersonalInfo.email,
      phone: userData.phone_number || editPersonalInfo.phone,
      paymentMethod: personalInfo.paymentMethod 
    };
    
    setPersonalInfo(updatedProfile);
    
   
    UserService.updateSessionStorage(userData);
    
    setIsEditingPersonalInfo(false);
    
    
    addNotification({
      type: 'success',
      title: 'Profile Updated',
      message: response.message || 'Your profile has been updated successfully',
      data: { timestamp: new Date().toISOString() }
    });
    
    console.log('✅ [Profile] Profile update completed successfully');
    
  } catch (error) {
    console.error('❌ [Profile] Update error:', error);
    
    
    let errorMessage = 'Failed to update profile. Please try again.';
    
    if (error.response) {
      
      const errorData = error.response.data;
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    addNotification({
      type: 'error',
      title: 'Update Failed',
      message: errorMessage,
      data: { error: error.message }
    });
  } finally {
    setLoading(false);
  }
};

const handleCourierRequest = async (packageData) => {
  try {
    
    if (!pickupCoords || !dropoffCoords) {
      setError('Please select both pickup and dropoff locations first');
      return;
    }

    if (!pickup || !dropoff) {
      setError('Please enter both pickup and dropoff addresses');
      return;
    }

    setLoading(true);
    
    
    const courierRequest = {
      pickup_address: pickup,
      dropoff_address: dropoff,
      pickup_lat: pickupCoords[0],
      pickup_lng: pickupCoords[1],
      dropoff_lat: dropoffCoords[0],
      dropoff_lng: dropoffCoords[1],
      vehicle_type: packageData.selected_vehicle, 
      service_type: 'courier', 
      estimated_fare: fareEstimate?.total || 0, 
      
      
      package_description: packageData.package_description,
      package_size: packageData.package_size,
      recipient_name: packageData.recipient_name,
      recipient_phone: packageData.recipient_phone,
      delivery_instructions: packageData.delivery_instructions
    };

    console.log('🟡 [Courier] Final request data:', courierRequest);
    
    const result = await RideService.requestRide(courierRequest);
    
    setActiveRide(result);
    setRideStatus('requested');
    
    addNotification({
      type: 'package_requested',
      title: 'Package Delivery Requested',
      message: `Looking for available couriers...`,
      data: result
    });

    console.log('✅ Courier request successful:', result);
    
  } catch (error) {
    console.error('❌ Courier request error:', error);
    console.error('❌ Full error object:', error);
    console.error('❌ Error response data:', error.response?.data);
    
    
    const errorData = error.response?.data;
    let errorMessage = 'Failed to request courier service. Please try again.';
    
    if (errorData) {
     
      if (errorData.service_type) {
        errorMessage = `Service type error: ${errorData.service_type[0]}`;
      } else if (errorData.vehicle_type) {
        errorMessage = `Vehicle type error: ${errorData.vehicle_type[0]}`;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    
    addAlert({
      type: 'error',
      title: 'Courier Request Failed',
      message: errorMessage,
      autoClose: true
    });
  } finally {
    setLoading(false);
  }
};

const handlePaymentChange = (field, value) => {
  if (field === 'mpesa' || field === 'visa') {
    handlePaymentMethodChange(field);
  } else {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  }
};

const handlePaymentMethods = () => {
  console.log('💳 Payment methods quick action triggered');
  setShowPaymentModal(true);
};

const handleChatHistory = () => {
  console.log('💬 Chat history quick action triggered');
  setShowChatHistory(true);
  loadAllChatHistory();
};

const loadAllChatHistory = async () => {
  try {
    setLoading(true);
    const chatHistory = await UserService.getChatHistory();
    setAllChatHistory(chatHistory || []);
  } catch (error) {
    console.error('Error loading chat history:', error);
    setAllChatHistory([]);
    addNotification({
      type: 'error',
      title: 'Load Failed',
      message: 'Failed to load chat history',
      data: { error: error.message }
    });
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
// Replace UserService.getProfile() with CustomerService.getProfile()
const loadUserData = async () => {
  try {
    setLoading(true);
    
    // Use CustomerService for customer-specific endpoints
    const userData = await CustomerService.getProfile();
    console.log('📊 [Profile] Loaded user data:', userData);
    
    if (userData) {
      const profileData = {
        firstName: userData.first_name || userData.firstName || '',
        lastName: userData.last_name || userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || userData.phone_number || '',
        paymentMethod: userData.payment_method || userData.paymentMethod || 'mpesa'
      };
      
      setPersonalInfo(profileData);
      setEditPersonalInfo(profileData);
      
      UserService.updateSessionStorage(userData);
    }
    
  } catch (error) {
    console.error('❌ [Profile] Error loading user data:', error);
    addNotification({
      type: 'error',
      title: 'Load Failed',
      message: error.message || 'Failed to load user profile',
      data: { error: error.message }
    });
  } finally {
    setLoading(false);
  }
};

  loadUserData();
}, []);

const handlePaymentMethodChange = (method) => {
  setPaymentDetails(prev => ({
    ...prev,
    method: method,
    
    ...(method === 'mpesa' ? { cardNumber: '', expiryDate: '', cvv: '', cardHolder: '' } : {}),
    ...(method === 'visa' ? { mpesaNumber: '' } : {})
  }));
};


const savePaymentDetails = async () => {
  
  if (paymentDetails.method === 'mpesa' && !paymentDetails.mpesa_number) {
    addAlert({
      type: 'error',
      title: 'Validation Error',
      message: 'Please enter your M-Pesa number',
      autoClose: true
    });
    return;
  }
  
  if (paymentDetails.method === 'visa') {
    if (!paymentDetails.card_number || !paymentDetails.expiry_date || !paymentDetails.cvv || !paymentDetails.card_holder) {
      addAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill all card details',
        autoClose: true
      });
      return;
    }
  }
  
  try {
    setLoading(true);
    
    const paymentData = {
      payment_type: paymentDetails.method,
      is_default: true,
      ...(paymentDetails.method === 'mpesa' && { 
        mpesa_number: paymentDetails.mpesa_number 
      }),
      ...(paymentDetails.method === 'visa' && {
        card_number: paymentDetails.card_number,
        expiry_date: paymentDetails.expiry_date,
        cvv: paymentDetails.cvv,
        card_holder: paymentDetails.card_holder
      })
    };

    console.log('🟡 [Payment] Saving payment data:', paymentData);
    
    const updatedPayment = await UserService.updatePaymentMethod(paymentData);

    console.log('✅ [Payment] Payment update response:', updatedPayment);
    
    
    setPaymentDetails(prev => ({
      ...prev,
      ...updatedPayment
    }));

   
    const updatedPersonalInfo = {
      ...personalInfo,
      paymentMethod: paymentDetails.method
    };
    
    setPersonalInfo(updatedPersonalInfo);
    setEditPersonalInfo(updatedPersonalInfo);
    
    setShowPaymentModal(false);

    addAlert({
      type: 'success',
      title: 'Payment Method Updated',
      message: `Your ${paymentDetails.method === 'mpesa' ? 'M-Pesa' : 'Visa'} payment method has been saved`,
      autoClose: true
    });
    
  } catch (error) {
    console.error('❌ [Payment] Error saving payment details:', error);
    
    let errorMessage = 'Failed to save payment method. Please try again.';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    addAlert({
      type: 'error',
      title: 'Save Failed',
      message: errorMessage,
      autoClose: true
    });
  } finally {
    setLoading(false);
  }
};

const handleCancelEdit = () => {
  setIsEditingPersonalInfo(false);
  setEditPersonalInfo({ ...personalInfo });
};

  const handleEmergencyContact = () => {
    console.log('🚨 Emergency contact quick action triggered');
    setShowEmergencyModal(true);
    
    addNotification({
      type: 'emergency_contact',
      title: 'Emergency Contact',
      message: 'Emergency contact feature opened',
      data: { timestamp: new Date().toISOString() }
    });
  };

  const handleScheduleRide = () => {
    console.log('⏰ Schedule ride quick action triggered');
    setShowScheduleModal(true);
  };

  const handleShareRide = () => {
    console.log('📤 Share ride quick action triggered');
    setShowShareModal(true);
  };

  const handleRideHistory = () => {
    console.log('📊 Ride history quick action triggered');
    setActiveTab('my-rides');
    
    addNotification({
      type: 'navigation',
      title: 'Ride History',
      message: 'Navigated to ride history',
      data: { tab: 'my-rides' }
    });
  };

  const handleScheduledRide = (scheduledRide) => {
    setScheduledRides(prev => [...prev, scheduledRide]);
    
    addAlert({
      type: 'ride_scheduled',
      title: 'Ride Scheduled',
      message: `Ride scheduled for ${scheduledRide.date} at ${scheduledRide.time}`,
      data: scheduledRide,
      autoClose: true
    });
    
    console.log('✅ Ride scheduled:', scheduledRide);
  };

 
  const saveToRideHistory = (ride) => {
    const rideWithHistory = {
      id: ride.id,
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      fare: ride.fare || ride.estimated_fare,
      vehicle_type: ride.vehicle_type,
      status: ride.status || 'requested',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance: distance,
      duration: duration
    };

    setRideHistory(prev => [rideWithHistory, ...prev]);
    console.log('✅ [History] Ride saved to history:', rideWithHistory);
  };

 
  const updateRideInHistory = (rideId, updates) => {
    setRideHistory(prev => 
      prev.map(ride => 
        ride.id === rideId ? { ...ride, ...updates, updated_at: new Date().toISOString() } : ride
      )
    );
  };

  
  useEffect(() => {
    const loadRideHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await RideService.getRideHistory();
        setRideHistory(history || []);
        console.log('✅ [History] Loaded ride history:', history?.length || 0, 'rides');
      } catch (error) {
        console.error('❌ [History] Error loading ride history:', error);
        setRideHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadRideHistory();
  }, []);

  const addNotification = (notification) => {
 
  const isSystemNotification = [
    'ride_requested', 'ride_accepted', 'driver_arrived', 
    'ride_completed', 'ride_cancelled', 'chat_message',
    'payment_updated', 'profile_updated', 'connection_established',  'ride_declined'
  ].includes(notification.type);

  if (!isSystemNotification) {
    
    addAlert({
      type: notification.type === 'error' ? 'error' : 'info',
      title: notification.title,
      message: notification.message,
      autoClose: true
    });
    return;
  }

  const newNotification = {
    id: Date.now(),
    ...notification,
    read: false
  };

  setNotifications(prev => [newNotification, ...prev]);
  setUnreadCount(prev => prev + 1);
  
  
  if (notification.type !== 'chat_message') {
    try { 
      new Audio('/notification.mp3').play().catch(() => {}); 
    } catch {}
  }
};

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (id) => {
    const removedNotif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    if (removedNotif && !removedNotif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

const clearAllAlerts = () => {
  setAlerts([]);
};

  const handleConnectionEstablished = () => {
    console.log('✅ [Customer] WebSocket connection established');
    setConnectionState('connected');
  };

  const handleRideDeclined = (data) => {
    console.log('❌ [Customer] Ride declined by driver:', data);
    
   
    setActiveRide(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            status: 'declined',
            decline_reason: data.message
        };
    });
    
    setRideStatus('declined');
    
    
    addNotification({
        type: 'ride_declined',
        title: 'Ride Declined',
        message: data.message || 'A driver declined your ride request',
        data: data
    });
    
  
    setTimeout(() => {
        console.log('🔄 [Customer] Resetting ride after decline');
        setActiveRide(null);
        setRideStatus(null);
        setDriverInfo(null);
    }, 5000);
    
    
    if (activeRide?.id) {
        updateRideInHistory(activeRide.id, {
            status: 'declined',
            decline_reason: data.message,
            declined_at: new Date().toISOString()
        });
    }
};

  const handleDriverArrived = (data) => {
    console.log('✅ [Customer] Driver has arrived:', data);
    setRideStatus('driver_arrived');
    setError('');
    
   
    addNotification({
      type: 'driver_arrived',
      title: 'Driver Arrived!',
      message: 'Your driver has arrived at the pickup location',
      data: data
    });
  };

  const handleRideAccepted = (data) => {
  console.log('✅ [Customer] Ride accepted by driver:', data);
  
  setActiveRide(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      driver: {
        id: data.driver_id,
        name: data.driver_name,
        phone: data.driver_phone
      },
      status: 'accepted'
    };
  });
  
  setRideStatus('accepted');
  setDriverInfo({
    id: data.driver_id, 
    first_name: data.driver_name?.split(' ')[0] || 'Driver',
    last_name: data.driver_name?.split(' ')[1] || '',
    phone_number: data.driver_phone,
    vehicle_type: data.vehicle_type
  });
  
  setError('');
  
 
  if (activeRide?.id) {
    updateRideInHistory(activeRide.id, {
      status: 'accepted',
      driver_name: data.driver_name,
      driver_phone: data.driver_phone
    });
  }
  
  
  addNotification({
    type: 'ride_accepted',
    title: 'Ride Accepted!',
    message: `${data.driver_name} is on the way to pick you up`,
    data: data
  });
  
  console.log('✅ [Customer] Ride status updated to: accepted');
};

const handleRideStatusUpdate = (data) => {
  console.log('🔄 [Customer] Ride status update:', data);
  setRideStatus(data.status);
  
  
  if (activeRide?.id) {
    updateRideInHistory(activeRide.id, { status: data.status });
  }
  
 
  if (data.status === 'accepted' && data.driver_id) {
    fetchDriverInfo(data.driver_id);
    addNotification({
      type: 'ride_accepted',
      title: 'Ride Accepted',
      message: 'A driver has accepted your ride request',
      data: data
    });
  }
  
  if (data.status === 'driving_to_destination') {
    addNotification({
      type: 'ride_in_progress',
      title: 'Ride Started',
      message: 'Your ride is now in progress',
      data: data
    });
  }
  
  if (data.status === 'completed') {
    
    if (activeRide?.id) {
      updateRideInHistory(activeRide.id, { 
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }
    
    addNotification({
      type: 'ride_completed',
      title: 'Ride Completed',
      message: 'Your ride has been completed successfully',
      data: data
    });
    console.log('🔚 [Customer] Ride ended with status: completed');
    setActiveRide(null);
    setDriverLocation(null);
    setDriverInfo(null);
    setRideStatus(null);
  }
  
  if (data.status === 'cancelled') {
    
    if (activeRide?.id) {
      updateRideInHistory(activeRide.id, { 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });
    }
    
    addNotification({
      type: 'ride_cancelled',
      title: 'Ride Cancelled',
      message: 'Your ride has been cancelled',
      data: data
    });
    console.log('🔚 [Customer] Ride ended with status: cancelled');
    setActiveRide(null);
    setDriverLocation(null);
    setDriverInfo(null);
    setRideStatus(null);
  }
};

  const handleDriverLocationUpdate = (data) => {
    setDriverLocation({ lat: data.lat, lng: data.lng });
  };


  
  
const handleVoiceCommand = async (command) => {
  try {
    console.log('🎤 Voice command processed:', command);
    
    
    if (command.pickup_address) {
      setPickup(command.pickup_address);
    }
    if (command.dropoff_address) {
      setDropoff(command.dropoff_address);
    }
    
    
    if (command.vehicle_type) {
      setSelectedVehicle(command.vehicle_type);
    }
    
    
    if (command.service_type === 'courier') {
      setActiveTab('courier');
     
      if (command.package_description) {
        setPackageDescription(command.package_description);
      }
    } else {
      setActiveTab('ride');
    }
    
   
    setShowVoiceAssistant(false);
    
   
    addNotification({
      type: 'voice_command',
      title: 'Voice Command Processed',
      message: `Ready to book ${command.type} to ${command.dropoff_address}`,
      data: command
    });
    
  } catch (error) {
    console.error('Voice command error:', error);
    addAlert({
      type: 'error',
      title: 'Voice Command Failed',
      message: error.message || 'Failed to process voice command',
      autoClose: true
    });
  }
};


 

const handleChatMessage = (data) => {
  console.log('💬 [Customer] New chat message received:', data);
  
  
  const formattedMessage = ChatService.formatMessage(data, 'customer');
  
  console.log('✅ [Customer] Formatted message:', formattedMessage);
  setChatMessages(prev => [...prev, formattedMessage]);
  
  if (!showChat) {
    addNotification({
      type: 'driver_message',
      title: 'New Message from Driver',
      message: data.message,
      data: data
    });
  }
};



useEffect(() => {
  const token = sessionStorage.getItem('access_token');
  const customerId = sessionStorage.getItem('user_id');
  const userType = sessionStorage.getItem('user_type');
  
  console.log(`🟡 [CustomerDash] Setting up WebSocket for ${userType}: ${customerId}`);
  
  if (userType !== 'customer') {
    console.log(`❌ [CustomerDash] User is ${userType}, not customer - skipping WebSocket setup`);
    return;
  }
  
  if (!customerId || !token) {
    console.log('❌ [CustomerDash] Missing credentials');
    return;
  }
  
  let isMounted = true;
  

const setupWebSocket = async () => {
  if (!isMounted) return;
  
  try {
   
    websocketService.clearComponentHandlers('CustomerDash');
    
   
    websocketService.registerHandler('ride_accepted', (data) => {
      console.log('✅ [Customer] Ride accepted with data:', data);
      
    
      const formattedData = {
        ride_id: data.ride_id,
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        driver_phone: data.driver_phone,
        vehicle_type: data.vehicle_type,
        license_plate: data.license_plate,
        timestamp: data.timestamp
      };
      
      handleRideAccepted(formattedData);
    }, 'CustomerDash');

    websocketService.registerHandler('ride_status_update', (data) => {
      console.log('🔄 [Customer] Ride status update:', data);
      handleRideStatusUpdate(data);
    }, 'CustomerDash');

    websocketService.registerHandler('location_update', (data) => {
      console.log('📍 [Customer] Driver location update:', data);
      handleDriverLocationUpdate(data);
    }, 'CustomerDash');


websocketService.registerHandler('driver_message', (data) => {
  console.log('💬 [Customer Frontend] Driver message received:', data);
  
  const formattedMessage = {
    id: Date.now() + Math.random(),
    message: data.message,
    sender: 'driver',
    timestamp: data.timestamp,
    sender_name: data.sender_name || 'Driver',
    isCurrentUser: false,
    ride_id: data.ride_id
  };
  
  console.log('💬 [Customer Frontend] Adding message to chat:', formattedMessage);
  
  
  setChatMessages(prev => [...prev, formattedMessage]);
  
  
  if (!showChat) {
    addNotification({
      type: 'driver_message',
      title: 'New Message from Driver',
      message: data.message,
      data: data
    });
  }
}, 'CustomerDash');

    websocketService.registerHandler('driver_arrived', (data) => {
      console.log('✅ [Customer] Driver arrived:', data);
      handleDriverArrived(data);
    }, 'CustomerDash');

    websocketService.registerHandler('connection_established', handleConnectionEstablished, 'CustomerDash');
    
    websocketService.registerHandler('ride_declined', (data) => {
      console.log('❌ [Customer] Ride declined:', data);
      handleRideDeclined(data);
    }, 'CustomerDash');

    if (!websocketService.isConnected() && !websocketService.isConnecting) {
      setConnectionState('connecting');
      await websocketService.connect('customer', customerId, token);
    } else {
      setConnectionState(websocketService.getConnectionState());
    }
  } catch (error) {
    console.error('❌ [CustomerDash] WebSocket setup error:', error);
    setConnectionState('error');
  }
};

 
  if (customerId && token && userType === 'customer') {
    setupWebSocket();
  }

  const connectionCheckInterval = setInterval(() => {
    if (isMounted) {
      setConnectionState(websocketService.getConnectionState());
    }
  }, 5000);

  return () => {
    console.log('🟡 [CustomerDash] Component unmounting - cleanup');
    isMounted = false;
    clearInterval(connectionCheckInterval);
    
    
    websocketService.clearComponentHandlers('CustomerDash');
  };
}, []);
  
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

  useEffect(() => {
 
  setSelectedVehicle('economy');
}, []);

  
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

  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

 
useEffect(() => {
  if (activeRide?.id) {
    
    const loadChatHistory = async () => {
      try {
        const messages = await RideService.getRideMessages(activeRide.id);
        setChatMessages(messages || []);
      } catch (error) {
        console.log('No existing chat messages or error loading:', error);
        setChatMessages([]);
      }
    };
    
    loadChatHistory();
  } else {
    setChatMessages([]);
  }
}, [activeRide?.id]);

  const fetchDriverInfo = async (driverId) => {
    try {
      const driverData = await RideService.getDriverInfo(driverId);
      setDriverInfo(driverData);
    } catch (error) {
      console.error('Error fetching driver info:', error);
    }
  };


const fareRates = {
  
  economy: {
    base: 100,
    per_km: 50,
    name: 'Economy',
    icon: '🚗',
    features: 'Affordable, everyday rides',
    multiplier: 1,
    service_type: 'ride'
  },
  boda: {
    base: 50,
    per_km: 30,
    name: 'Boda',
    icon: '🏍️',
    features: 'Fast & affordable motorcycle',
    multiplier: 0.7,
    service_type: 'ride'
  },
  premium: {
    base: 150,
    per_km: 75,
    name: 'Premium',
    icon: '🚙',
    features: 'Comfort & extra space',
    multiplier: 1.5,
    service_type: 'ride'
  },
  
  courier_bike: {
    base: 60,
    per_km: 25,
    name: 'Courier Bike',
    icon: '🏍️',
    features: 'Fast package delivery',
    multiplier: 0.8,
    max_weight: '5kg',
    service_type: 'package'
  },
  courier_car: {
    base: 120,
    per_km: 40,
    name: 'Courier Car',
    icon: '🚗',
    features: 'Large packages & fragile items',
    multiplier: 1.2,
    max_weight: '25kg',
    service_type: 'package'
  }
};


  
 const searchAddress = async (query, type) => {
  console.log(`🔍 [Autocomplete] Searching for: "${query}" (${type})`);
  
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
   
    let locationData = {};
    if (currentLocation) {
      locationData = {
        lat: currentLocation[0],
        lng: currentLocation[1]
      };
    }

    const suggestions = await RideService.autocompleteAddress(query, locationData);
    console.log(`✅ [Autocomplete] Got ${suggestions.length} results:`, suggestions);
    
    if (type === 'pickup') {
      setPickupSuggestions(suggestions);
      setShowPickupSuggestions(suggestions.length > 0);
    } else {
      setDropoffSuggestions(suggestions);
      setShowDropoffSuggestions(suggestions.length > 0);
    }
  } catch (error) {
    console.error('❌ [Autocomplete] Search error:', error);
    if (type === 'pickup') {
      setShowPickupSuggestions(false);
    } else {
      setShowDropoffSuggestions(false);
    }
  } finally {
    setIsLoadingSuggestions(false);
  }
};

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

const calculateRoute = async () => {
  if (!pickupCoords || !dropoffCoords) {
    setError('Please select both pickup and dropoff locations');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const routeData = {
      pickup_address: pickup,
      dropoff_address: dropoff,
      pickup_lat: pickupCoords[0],
      pickup_lng: pickupCoords[1],
      dropoff_lat: dropoffCoords[0],
      dropoff_lng: dropoffCoords[1],
      vehicle_type: selectedVehicle
    };

    
    const result = await RideService.calculateRoute(routeData);
    
 
    setDistance(result.distance_km);
    setDuration(result.duration_min);
    setRouteGeometry(result.route_polyline);
    
    
    setAllVehicleFares(result.all_fares);
    
    
    if (result.all_fares[selectedVehicle]) {
      setFareEstimate(result.all_fares[selectedVehicle]);
    }

    console.log('✅ Route calculated successfully - no notifications sent to drivers');

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    setError(error.message || 'Could not calculate route. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleLogout = () => {
  
  sessionStorage.clear();
  
  setActiveRide(null);
  setRideStatus(null);
  setDriverInfo(null);
 
  window.location.href = '/login';
};


const handleVehicleSelect = (vehicleType) => {
  setSelectedVehicle(vehicleType);
  
  
  if (allVehicleFares[vehicleType]) {
    setFareEstimate(allVehicleFares[vehicleType]);
  }
};


const calculateLocalFare = (distanceKm, durationMin) => {
  const rates = fareRates[selectedVehicle];
  
  
  const baseFare = rates.base;
  const distanceCharge = distanceKm * rates.perKm;
  const timeCharge = durationMin * rates.perMin;
  
  
  const hour = new Date().getHours();
  const surgeMultiplier = (7 <= hour && hour <= 9) || (17 <= hour && hour <= 19) ? 1.2 : 1;
  
  const subtotal = baseFare + distanceCharge + timeCharge;
  const surgeCharge = subtotal * (surgeMultiplier - 1);
  const totalFare = Math.round(subtotal * surgeMultiplier);
  
  setFareEstimate({
    base: Math.round(baseFare),
    distance: Math.round(distanceCharge),
    time: Math.round(timeCharge),
    surge: Math.round(surgeCharge),
    total: totalFare,
    surge_multiplier: surgeMultiplier
  });
};


const calculateVehicleFare = (vehicleType, distanceKm, durationMin) => {
  const rate = fareRates[vehicleType];
  
  const baseFare = rate.base;
  const distanceCharge = distanceKm * rate.perKm;
  const timeCharge = durationMin * rate.perMin;
  
  const hour = new Date().getHours();
  const surgeMultiplier = (7 <= hour && hour <= 9) || (17 <= hour && hour <= 19) ? 1.2 : 1;
  
  const subtotal = baseFare + distanceCharge + timeCharge;
  const surgeCharge = subtotal * (surgeMultiplier - 1);
  const totalFare = Math.round(subtotal * surgeMultiplier);
  
  return {
    base: Math.round(baseFare),
    distance: Math.round(distanceCharge),
    time: Math.round(timeCharge),
    surge: Math.round(surgeCharge),
    total: totalFare,
    surge_multiplier: surgeMultiplier
  };
};

const useCurrentLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    setLoading(true);
    setLocationLoading(true);

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const pos = [position.coords.latitude, position.coords.longitude];
          
          console.log("📍 [Current Location] GPS Coordinates:", {
            latitude: pos[0],
            longitude: pos[1],
            accuracy: `${position.coords.accuracy}m`
          });

          // Set location immediately
          setCurrentLocation(pos);
          setPickupCoords(pos);
          setMapCenter(pos);

          // Update map view
          if (mapRef.current) {
            mapRef.current.setView(pos, 15);
          }

          // ✅ FIXED: Proper reverse geocoding with better error handling
          try {
            console.log("📍 [Reverse Geocode] Calling backend with:", { lat: pos[0], lng: pos[1] });
            
            const addressData = await RideService.reverseGeocode(pos[0], pos[1]);
            console.log("📍 [Reverse Geocode] Backend response:", addressData);
            
            if (addressData && addressData.address && !addressData.is_fallback) {
              setPickup(addressData.address);
              console.log("📍 Using reverse geocoded address:", addressData.address);
            } else {
              // If we get a fallback, try to get a better address
              const betterAddress = await getBetterAddressFromCoords(pos[0], pos[1]);
              setPickup(betterAddress);
              console.log("📍 Using improved address:", betterAddress);
            }
          } catch (geocodeError) {
            console.error("📍 Reverse geocoding failed:", geocodeError);
            // Create a meaningful address from coordinates
            const coordinateAddress = await createAddressFromCoords(pos[0], pos[1]);
            setPickup(coordinateAddress);
          }

          setError('');
          resolve(pos);
          
        } catch (error) {
          console.error("❌ Location processing error:", error);
          setError(error.message);
          reject(error);
        } finally {
          setLoading(false);
          setLocationLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        setLocationLoading(false);
        
        let errorMessage = 'Location access denied. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location permissions in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
            break;
        }
        
        setError(errorMessage);
        reject(new Error(errorMessage));
      },
      geolocationOptions
    );
  });
};

// ✅ ADD: Helper function to create better address from coordinates
const createAddressFromCoords = async (lat, lng) => {
  try {
    // Try to get nearby places using your autocomplete service
    const nearbyResults = await RideService.autocompleteAddress("", { lat, lng });
    
    if (nearbyResults && nearbyResults.length > 0) {
      // Use the first nearby result
      return nearbyResults[0].description || `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.log("📍 Could not get nearby places, using coordinates");
  }
  
  // Final fallback - format coordinates nicely
  return `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

// ✅ ADD: Function to improve address quality
const getBetterAddressFromCoords = async (lat, lng) => {
  try {
    // Try a more specific reverse geocoding approach
    const testAddresses = [
      "Nairobi, Kenya",
      "Westlands, Nairobi",
      "CBD, Nairobi"
    ];
    
    // You could also make a direct Google Maps API call here if needed
    return `Current Location in Nairobi (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    return `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
};

const handleUseCurrentLocation = async () => {
  try {
    console.log("📍 Attempting to get current location...");
    
    const position = await useCurrentLocation();
    
    // Verify the coordinates are valid
    if (position && position[0] && position[1]) {
      console.log("📍 Location set successfully:", position);
      
      addAlert({
        type: 'success',
        title: 'Location Updated',
        message: 'Your current location has been set successfully',
        autoClose: true
      });
      
      return position;
    } else {
      throw new Error('Invalid coordinates received');
    }
  } catch (error) {
    console.error('❌ Location error:', error);
    
    let userMessage = error.message;
    if (error.message.includes('permission')) {
      userMessage = 'Please enable location permissions in your browser settings and try again.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Location request timed out. Please check your connection and try again.';
    }
    
    addAlert({
      type: 'error',
      title: 'Location Error',
      message: userMessage,
      autoClose: true
    });
    
    throw error;
  }
};


const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_API_KEY`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      const address = data.results[0].formatted_address;
      setPickup(`Current Location: ${address}`);
      console.log("📍 Reverse geocoded address:", address);
    } else {
      setPickup(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  } catch (error) {
    console.error("Reverse geocode error:", error);
    setPickup(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  }
};



const sendMessage = async () => {
  if (!newMessage.trim() || !activeRide || !driverInfo) {
    console.log('❌ [Customer Chat] Cannot send - no message, ride, or driver info');
    console.log('💬 [Customer Chat DEBUG] State:', {
      hasMessage: !!newMessage.trim(),
      hasActiveRide: !!activeRide,
      hasDriverInfo: !!driverInfo,
      activeRide: activeRide,
      driverInfo: driverInfo
    });
    return;
  }

  try {
    console.log('💬 [Customer Chat DEBUG] Starting to send message:', {
      message: newMessage,
      rideId: activeRide.id,
      driverId: driverInfo.id,
      activeRide: activeRide,
      driverInfo: driverInfo
    });

    await ChatService.sendCustomerMessage(
      activeRide.id, 
      newMessage, 
      driverInfo.id
    );

    console.log('✅ [Customer Chat DEBUG] Message sent successfully');

    
    const sentMessage = {
      id: Date.now() + Math.random(),
      message: newMessage,
      sender: 'customer',
      timestamp: new Date().toISOString(),
      sender_name: sessionStorage.getItem('user_name') || 'You',
      isCurrentUser: true,
      ride_id: activeRide.id
    };

    setChatMessages(prev => [...prev, sentMessage]);
    setNewMessage('');

  } catch (error) {
    console.error('❌ [Customer Chat] Error sending message:', error);
    addAlert({
      type: 'error',
      title: 'Message Failed',
      message: 'Failed to send message. Please try again.',
      autoClose: true
    });
  }
};

 
const requestRide = async () => {
  if (isRequestingRide || activeRide) {
    console.log('🟡 [Customer] Ride request already in progress or active ride exists');
    return;
  }

  if (!fareEstimate) {
    setError('Please calculate a route first');
    return;
  }

  setLoading(true);
  setIsRequestingRide(true);
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
      estimated_fare: fareEstimate.total,
      service_type: 'ride', 
      request_type: 'ride'
    };

    console.log('🟡 [Customer] Requesting ride with data:', rideData);
    
    
    const result = await RideService.requestRide(rideData);
    
    setActiveRide(result);
    setRideStatus('requested');
    
    addNotification({
      type: 'ride_requested',
      title: 'Ride Requested',
      message: 'Looking for available drivers...',
      data: result
    });

    saveToRideHistory(result);
    
    console.log('✅ [Customer] Ride requested successfully - notifications sent to drivers');
    
  } catch (error) {
    console.error('❌ [Customer] Ride request error:', error);
    setError(error.message || 'Failed to request ride. Please try again.');
  } finally {
    setLoading(false);
    setIsRequestingRide(false);
  }
};

 
  const MapController = () => {
  const map = useMap();
  
  useEffect(() => {
    console.log("🗺️ [MapController] Updating map view...");
    
    
    if (pickupCoords) {
      console.log("📍 [MapController] Centering to pickup:", pickupCoords);
      map.setView(pickupCoords, 15);
    } 
   
    else if (currentLocation) {
      console.log("📍 [MapController] Centering to current location:", currentLocation);
      map.setView(currentLocation, 15);
    }
   
    else if (pickupCoords && dropoffCoords) {
      const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
      map.fitBounds(bounds, { padding: [20, 20] });
      console.log("📍 [MapController] Fitting bounds");
    }
    
  }, [map, pickupCoords, dropoffCoords, currentLocation]);

  return null;
};

  
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

  


const handleAutoCalculate = useCallback(async (voiceCommand) => {
  try {
    console.log('🔄 [Auto] Starting automated route calculation...');
    
   
    setPickup(voiceCommand.pickup_address);
    setDropoff(voiceCommand.dropoff_address);
    setSelectedVehicle(voiceCommand.vehicle_type);
    
    if (voiceCommand.service_type === 'courier') {
      setActiveTab('courier');
      if (voiceCommand.package_description) {
        setPackageDescription(voiceCommand.package_description);
      }
    } else {
      setActiveTab('ride');
    }

    
    setTimeout(async () => {
      try {
        
        await calculateRoute();
        
        
        speak(`Route calculated! Your ${fareRates[voiceCommand.vehicle_type]?.name} will cost approximately KSH ${fareEstimate?.total?.toLocaleString()}. Ready to book when you are.`);
        
       
        addNotification({
          type: 'voice_auto_calculated',
          title: 'Route Calculated Automatically',
          message: `Your ${fareRates[voiceCommand.vehicle_type]?.name} is ready to book for KSH ${fareEstimate?.total?.toLocaleString()}`,
          data: { fare: fareEstimate, command: voiceCommand }
        });
        
      } catch (calcError) {
        console.error('Auto-calculation failed:', calcError);
        speak("I had trouble calculating the route. Please check the locations and try again.");
      }
    }, 1000);
    
  } catch (error) {
    console.error('Auto-process failed:', error);
    speak("Sorry, I encountered an error while processing your request.");
  }
}, []); 


const {
  isListening,
  transcript,
  isProcessing,
  error: voiceError,
  startListening,
  stopListening,
  processVoiceCommand,
  speak
} = VoiceAssistant(handleAutoCalculate);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">

      
      <AlertSystem alerts={alerts} onRemoveAlert={removeAlert} />
     
      {connectionState !== 'connected' && (
        <div className={`px-4 py-2 text-center text-sm font-medium ${
          connectionState === 'connecting' ? 'bg-yellow-500/20 text-yellow-300' :
          connectionState === 'error' ? 'bg-red-500/20 text-red-300' :
          'bg-gray-500/20 text-gray-300'
        }`}>
          {connectionState === 'connecting' && '🟡 Connecting to server...'}
          {connectionState === 'disconnected' && '🔴 Disconnected from server'}
          {connectionState === 'error' && '❌ Connection error'}
        </div>
      )}

      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <Car className="w-6 h-6 text-white -rotate-12" />
              </div>
              <Link to='/homepage'>
                <span className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-yellow-200 bg-clip-text text-transparent hover:green-500">
                  Ryde 
                </span>
              </Link>
              <span className="text-2xl font-black text-white">Customer</span>
            </div>

            <div className="flex items-center gap-4">

              <button
    onClick={() => setShowVoiceAssistant(true)}
    className="relative p-2 text-white/80 hover:text-white transition-colors bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/30"
    title="Voice Assistant"
  >
    <Mic className="w-6 h-6" />
    {isListening && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
    )}
  </button>
              
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onClearNotification={clearNotification}
                onMarkAllAsRead={markAllAsRead}
              />

              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 border border-white/20">
                <User className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">
                  {sessionStorage.getItem('customer_name') || sessionStorage.getItem('user_name') || 'Customer'}
                </span>
              </div>

              <button
  onClick={handleLogout}
  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white px-4 py-2 rounded-xl border border-red-500/30 transition-colors flex items-center gap-2"
  title="Logout"
>
  <span>Logout</span>
</button>

            </div>
          </div>

          <nav className="flex space-x-8">
            {[
              { id: 'ride', label: 'Book Ride', icon: Car },
              { id: 'my-rides', label: 'My Rides', icon: Navigation },
              { id: 'courier', label: 'Courier', icon: Package },
              { id: 'profile', label: 'Profile', icon: User }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'ride' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            
            
            {activeRide && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white border-b border-emerald-400/30">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Ride in Progress</h3>
                    <p className="text-emerald-100 capitalize">
                      Status: {rideStatus ? rideStatus.replace('_', ' ') : 'Waiting for driver'}
                    </p>
                    {!rideStatus && (
                      <p className="text-emerald-200 text-sm mt-1">
                        Searching for available drivers...
                      </p>
                    )}
                  </div>
    <div className="flex gap-2">
      {activeRide && (
        <button 
          onClick={() => setShowChat(!showChat)}
          className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center gap-2 border border-white/30"
        >
          <MessageCircle size={16} />
          Chat {notifications.some(n => n.type === 'chat_message' && !n.read) && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      )}
    </div>
                </div>

                {driverInfo && rideStatus === 'accepted' && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center border border-white/30">
                        <User className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {driverInfo.first_name} {driverInfo.last_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-emerald-100">
                          <div className="flex items-center gap-1">
                            <Car size={14} />
                            {driverInfo.vehicle_type}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            {driverInfo.phone_number}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} />
                            4.9 ★
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            
            {error && (
              <div className="bg-red-500/20 border-l-4 border-red-400 p-4 mx-6 mt-4 text-white">
                <div className="flex items-center">
                  <AlertCircle className="text-red-300 mr-2" size={20} />
                  <p>{error}</p>
                </div>
              </div>
            )}

            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              
             
              <div className="lg:col-span-1 p-6 space-y-6 border-r border-white/20">
                
               
                <div ref={pickupRef} className="relative">
                  <label className="block text-sm font-semibold text-white mb-2">
                    <MapPin className="inline w-4 h-4 mr-1 text-emerald-300" />
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => handleAddressInput(e.target.value, 'pickup')}
                      onFocus={() => pickup.length >= 3 && setShowPickupSuggestions(true)}
                      placeholder="Enter pickup address"
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-emerald-400 focus:outline-none text-white placeholder-white/60 pr-20"
                      disabled={activeRide}
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
  <button
    onClick={handleUseCurrentLocation}
    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition border border-emerald-600 flex items-center gap-1"
    title="Use my current location"
    disabled={activeRide}
  >
    <Navigation size={14} />
    <span className="text-xs">Current</span>
  </button>
  <div className="bg-white/10 p-2 rounded-lg border border-white/20">
    <Search className="text-white/60" size={16} />
  </div>
</div>


                    
                    
                    {showPickupSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingSuggestions ? (
                          <div className="p-3 text-white/60 text-center">Loading suggestions...</div>
                        ) : pickupSuggestions.length > 0 ? (
                          pickupSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.place_id}
                              className="p-3 hover:bg-emerald-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                              onClick={() => handleAddressSelect(suggestion, 'pickup')}
                            >
                              <div className="flex items-start">
                                <MapPin className="text-emerald-300 mt-0.5 mr-2 flex-shrink-0" size={16} />
                                <span className="text-sm text-white">{suggestion.description}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-white/60 text-center">No suggestions found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                
                <div ref={dropoffRef} className="relative">
                  <label className="block text-sm font-semibold text-white mb-2">
                    <MapPin className="inline w-4 h-4 mr-1 text-emerald-300" />
                    Dropoff Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dropoff}
                      onChange={(e) => handleAddressInput(e.target.value, 'dropoff')}
                      onFocus={() => dropoff.length >= 3 && setShowDropoffSuggestions(true)}
                      placeholder="Enter destination address"
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-emerald-400 focus:outline-none text-white placeholder-white/60 pr-12"
                      disabled={activeRide}
                    />
                    <div className="absolute right-2 top-2">
                      <div className="bg-white/10 p-2 rounded-lg border border-white/20">
                        <Search className="text-white/60" size={16} />
                      </div>
                    </div>
                    
                    {showDropoffSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingSuggestions ? (
                          <div className="p-3 text-white/60 text-center">Loading suggestions...</div>
                        ) : dropoffSuggestions.length > 0 ? (
                          dropoffSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.place_id}
                              className="p-3 hover:bg-emerald-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                              onClick={() => handleAddressSelect(suggestion, 'dropoff')}
                            >
                              <div className="flex items-start">
                                <MapPin className="text-emerald-300 mt-0.5 mr-2 flex-shrink-0" size={16} />
                                <span className="text-sm text-white">{suggestion.description}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-white/60 text-center">No suggestions found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                
{!activeRide && (
  <button
    onClick={calculateRoute}
    disabled={!pickupCoords || !dropoffCoords || loading}
    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
      pickupCoords && dropoffCoords && !loading
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg border border-emerald-400/30'
        : 'bg-gray-600 cursor-not-allowed border border-white/20'
    }`}
  >
    {loading ? 'Calculating...' : 
     pickupCoords && dropoffCoords ? 'Calculate Route & Fares' : 'Select Locations'}
  </button>
)}



{!activeRide && (
  <div>
    <label className="block text-sm font-semibold text-white mb-3">
      Choose a ride
    </label>
    <div className="space-y-2">
      {Object.entries(fareRates)
        .filter(([key, rate]) => rate.service_type === 'ride') 
        .map(([key, rate]) => {
          
          const vehicleFare = allVehicleFares[key]; 
          
          return (
            <button
              key={key}
              onClick={() => handleVehicleSelect(key)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedVehicle === key
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rate.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-white">{rate.name}</p>
                    {distance && duration ? (
                      <p className="text-xs text-white/60">
                        {Math.round(duration)} min • {distance.toFixed(1)} km
                      </p>
                    ) : (
                      <p className="text-xs text-white/60">
                        Select locations first
                      </p>
                    )}
                    {rate.features && (
                      <p className="text-xs text-emerald-300 mt-1">
                        {rate.features}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {vehicleFare ? ( 
                    <>
                      <p className="font-bold text-white text-lg">
                        KSH {vehicleFare.total?.toLocaleString() || '---'}
                      </p>
                      <p className="text-xs text-white/60">
                        {vehicleFare.surge_multiplier > 1 ? 'Surge pricing' : 'Standard fare'}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/60">--</p>
                  )}
                </div>
                {selectedVehicle === key && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border border-white/30 ml-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
    </div>
  </div>
)}

                
                {distance && duration && !activeRide && (
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-400/30">
                    <h3 className="font-semibold text-white mb-3">Trip Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Distance</span>
                        <span className="font-bold text-white">
                          {distance.toFixed(2)} km
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Duration</span>
                        <span className="font-bold text-white">
                          {Math.round(duration)} mins
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {driverLocation && activeRide && (
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-400/30">
                    <h4 className="font-semibold text-emerald-300 mb-2">Driver Location</h4>
                    <p className="text-sm text-emerald-200">
                      Driver is {distance && `approximately ${(distance * 0.8).toFixed(1)} km away`}
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(80, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}


{!activeRide && (
  <button
    onClick={requestRide}
    disabled={!fareEstimate || loading || isRequestingRide}
    className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
      fareEstimate && !loading && !isRequestingRide
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:scale-105 border border-emerald-400/30'
        : 'bg-gray-600 cursor-not-allowed border border-white/20'
    }`}
  >
    {isRequestingRide ? 'Requesting...' : 
     loading ? 'Calculating...' : 
     fareEstimate ? `Request ${fareRates[selectedVehicle].name} - KSH ${fareEstimate.total?.toLocaleString() || '---'}` : 'Enter Locations'}
  </button>
)}
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
                      icon={createCustomIcon('#10B981', 'Y')}
                    >
                      <Popup>Your Current Location</Popup>
                    </Marker>
                  )}
                  
                  
                  {pickupCoords && (
                    <Marker 
                      position={pickupCoords}
                      icon={createCustomIcon('#3B82F6', 'P')}
                    >
                      <Popup>Pickup Location</Popup>
                    </Marker>
                  )}
                  
                  
                  {dropoffCoords && (
                    <Marker 
                      position={dropoffCoords}
                      icon={createCustomIcon('#EF4444', 'D')}
                    >
                      <Popup>Dropoff Location</Popup>
                    </Marker>
                  )}
                  
                 
                  {driverLocation && (
                    <Marker 
                      position={[driverLocation.lat, driverLocation.lng]}
                      icon={createCustomIcon('#F59E0B', 'DR')}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">Your Driver</p>
                          {driverInfo && (
                            <p>{driverInfo.first_name} {driverInfo.last_name}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
          
          {routeGeometry && (
            <Polyline
              positions={decodePolyline(routeGeometry)}
              color="#10B981"
              weight={5}
              opacity={0.8}
            />
          )}
        </MapContainer>
        
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Calculating route...</p>
            </div>
          </div>
        )}
        </div>
      </div>
    
  </div>
)}


{activeTab === 'my-rides' && (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
    <div className="p-6 border-b border-white/20">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <Navigation className="w-8 h-8 text-emerald-400" />
        My Ride History
      </h2>
      <p className="text-white/60 mt-2">View your past and upcoming rides</p>
    </div>

    <div className="p-6">
     
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Rides</p>
              <p className="text-white text-xl font-bold">{rideHistory.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">This Month</p>
              <p className="text-white text-xl font-bold">
                {rideHistory.filter(ride => {
                  const rideDate = new Date(ride.created_at);
                  const now = new Date();
                  return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Completed</p>
              <p className="text-white text-xl font-bold">
                {rideHistory.filter(ride => ride.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Spent</p>
              <p className="text-white text-xl font-bold">
                KSH {rideHistory
                  .filter(ride => ride.status === 'completed')
                  .reduce((total, ride) => total + (parseFloat(ride.fare) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

     
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Rides</h3>
        
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading ride history...</p>
          </div>
        ) : rideHistory.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <Car className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">No Ride History</h4>
            <p className="text-white/60 mb-4">You haven't taken any rides yet</p>
            <button 
              onClick={() => setActiveTab('ride')}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Book Your First Ride
            </button>
          </div>
        ) : (
          rideHistory.map((ride) => (
            <div key={ride.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ride.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      ride.status === 'driving_to_destination' ? 'bg-blue-500/20 text-blue-300' :
                      ride.status === 'accepted' ? 'bg-yellow-500/20 text-yellow-300' :
                      ride.status === 'requested' ? 'bg-gray-500/20 text-gray-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {ride.status ? ride.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                    <span className="text-white/40 text-sm">
                      {new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white">{ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-white">{ride.dropoff_address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-white/60 capitalize">{ride.vehicle_type} • {ride.distance ? `${ride.distance} km` : 'Distance not available'}</span>
                    <span className="text-emerald-300 font-bold">KSH {parseFloat(ride.fare || 0).toLocaleString()}</span>
                  </div>
                  {ride.driver_name && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-white/60">
                      <User className="w-3 h-3" />
                      Driver: {ride.driver_name}
                    </div>
                  )}
                </div>
                <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-white text-sm transition-colors">
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Rides</h3>
        <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-400/20 text-center">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h4 className="text-yellow-300 font-semibold mb-2">No Upcoming Rides</h4>
          <p className="text-yellow-200/60 text-sm">
            You don't have any scheduled rides. Book a ride to see it here!
          </p>
          <button 
            onClick={() => setActiveTab('ride')}
            className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Book a Ride
          </button>
        </div>
      </div>
    </div>
  </div>
)}


{activeTab === 'courier' && (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
    
    
    {activeRide && activeRide.service_type === 'package' && (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white border-b border-blue-400/30">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Package Delivery in Progress</h3>
            <p className="text-blue-100 capitalize">
              Status: {rideStatus ? rideStatus.replace('_', ' ') : 'Waiting for courier'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowChat(!showChat)}
              className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition flex items-center gap-2 border border-white/30"
            >
              <MessageCircle size={16} />
              Chat
            </button>
          </div>
        </div>

        {driverInfo && rideStatus === 'accepted' && (
          <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center border border-white/30">
                <User className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {driverInfo.first_name} {driverInfo.last_name}
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <div className="flex items-center gap-1">
                    <Car size={14} />
                    {fareRates[activeRide.vehicle_type]?.name || 'Courier'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={14} />
                    {driverInfo.phone_number}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

 {!activeRide && distance && (
  <div>
    <label className="block text-sm font-semibold text-white mb-3">
      Choose Courier Type
    </label>
    <div className="space-y-2">
      {Object.entries(fareRates)
        .filter(([key, rate]) => rate.service_type === 'package')
        .map(([key, rate]) => {
          
          const vehicleFare = allVehicleFares[key]; 
          
          return (
            <button
              key={key}
              onClick={() => handleVehicleSelect(key)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedVehicle === key
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rate.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-white">{rate.name}</p>
                    {distance && duration ? (
                      <p className="text-xs text-white/60">
                        {Math.round(duration)} min • {distance.toFixed(1)} km
                      </p>
                    ) : (
                      <p className="text-xs text-white/60">
                        Select locations first
                      </p>
                    )}
                    {rate.features && (
                      <p className="text-xs text-blue-300 mt-1">
                        {rate.features}
                      </p>
                    )}
                    {rate.max_weight && (
                      <p className="text-xs text-white/60 mt-1">
                        Max: {rate.max_weight}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {vehicleFare ? (
                    <>
                      <p className="font-bold text-white text-lg">
                        KSH {vehicleFare.total?.toLocaleString() || '---'}
                      </p>
                      <p className="text-xs text-white/60">
                        {vehicleFare.surge_multiplier > 1 ? 'Surge pricing' : 'Standard fare'}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/60">--</p>
                  )}
                </div>
                {selectedVehicle === key && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/30 ml-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
    </div>
  </div>
)}
      </div>
    )}

    
    {error && (
      <div className="bg-red-500/20 border-l-4 border-red-400 p-4 mx-6 mt-4 text-white">
        <div className="flex items-center">
          <AlertCircle className="text-red-300 mr-2" size={20} />
          <p>{error}</p>
        </div>
      </div>
    )}

   
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
      
     
      <div className="lg:col-span-1 p-6 space-y-6 border-r border-white/20">
        
       
        <div>
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-300" />
            I want to...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPackageType('send')}
              className={`p-4 rounded-xl border-2 transition-all ${
                packageType === 'send'
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-blue-300" />
                <span className="text-white font-medium text-sm">Send Package</span>
              </div>
            </button>
            <button
              onClick={() => setPackageType('receive')}
              className={`p-4 rounded-xl border-2 transition-all ${
                packageType === 'receive'
                  ? 'border-green-400 bg-green-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Download className="w-6 h-6 text-green-300" />
                <span className="text-white font-medium text-sm">Receive Package</span>
              </div>
            </button>
          </div>
        </div>

        

       
        <div ref={pickupRef} className="relative">
          <label className="block text-sm font-semibold text-white mb-2">
            <MapPin className="inline w-4 h-4 mr-1 text-blue-300" />
            {packageType === 'send' ? 'Pickup Location' : 'Your Location'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={pickup}
              onChange={(e) => handleAddressInput(e.target.value, 'pickup')}
              onFocus={() => pickup.length >= 3 && setShowPickupSuggestions(true)}
              placeholder={packageType === 'send' ? "Where to pick up package?" : "Your current location"}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60 pr-20"
              disabled={activeRide}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                onClick={handleUseCurrentLocation}
                className="bg-blue-500/20 text-blue-300 p-2 rounded-lg hover:bg-blue-500/30 transition border border-blue-500/30"
                title="Use current location"
                disabled={activeRide}
              >
                <Navigation size={16} />
              </button>
              <div className="bg-white/10 p-2 rounded-lg border border-white/20">
                <Search className="text-white/60" size={16} />
              </div>
            </div>
            
            
            {showPickupSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-white/60 text-center">Loading suggestions...</div>
                ) : pickupSuggestions.length > 0 ? (
                  pickupSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="p-3 hover:bg-blue-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                      onClick={() => handleAddressSelect(suggestion, 'pickup')}
                    >
                      <div className="flex items-start">
                        <MapPin className="text-blue-300 mt-0.5 mr-2 flex-shrink-0" size={16} />
                        <span className="text-sm text-white">{suggestion.description}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-white/60 text-center">No suggestions found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div ref={dropoffRef} className="relative">
          <label className="block text-sm font-semibold text-white mb-2">
            <MapPin className="inline w-4 h-4 mr-1 text-blue-300" />
            {packageType === 'send' ? 'Delivery Location' : "Sender's Location"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={dropoff}
              onChange={(e) => handleAddressInput(e.target.value, 'dropoff')}
              onFocus={() => dropoff.length >= 3 && setShowDropoffSuggestions(true)}
              placeholder={packageType === 'send' ? "Where to deliver package?" : "Where is package coming from?"}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60 pr-12"
              disabled={activeRide}
            />
            <div className="absolute right-2 top-2">
              <div className="bg-white/10 p-2 rounded-lg border border-white/20">
                <Search className="text-white/60" size={16} />
              </div>
            </div>
            
            
            {showDropoffSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-white/60 text-center">Loading suggestions...</div>
                ) : dropoffSuggestions.length > 0 ? (
                  dropoffSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="p-3 hover:bg-blue-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                      onClick={() => handleAddressSelect(suggestion, 'dropoff')}
                    >
                      <div className="flex items-start">
                        <MapPin className="text-blue-300 mt-0.5 mr-2 flex-shrink-0" size={16} />
                        <span className="text-sm text-white">{suggestion.description}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-white/60 text-center">No suggestions found</div>
                )}
              </div>
            )}
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            <Package className="inline w-4 h-4 mr-1 text-blue-300" />
            Package Details
          </label>
          <textarea
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            placeholder="What are you sending/receiving? (e.g., Documents, Electronics, Food, etc.)"
            rows={3}
            className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60"
            disabled={activeRide}
          />
        </div>

       
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            <User className="inline w-4 h-4 mr-1 text-blue-300" />
            {packageType === 'send' ? "Recipient's Information" : "Your Information"}
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={packageType === 'send' ? "Recipient full name" : "Your full name"}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60"
              disabled={activeRide}
            />
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder={packageType === 'send' ? "Recipient phone (07XX XXX XXX)" : "Your phone (07XX XXX XXX)"}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60"
              disabled={activeRide}
            />
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            <MessageCircle className="inline w-4 h-4 mr-1 text-blue-300" />
            Delivery Instructions
          </label>
          <textarea
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            placeholder="Special instructions for the courier (optional)"
            rows={2}
            className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-400 focus:outline-none text-white placeholder-white/60"
            disabled={activeRide}
          />
        </div>

        
        {!activeRide && (
          <button
            onClick={calculateRoute}
            disabled={!pickupCoords || !dropoffCoords || loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              pickupCoords && dropoffCoords && !loading
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg border border-blue-400/30'
                : 'bg-gray-600 cursor-not-allowed border border-white/20'
            }`}
          >
            {loading ? 'Calculating...' : 
             pickupCoords && dropoffCoords ? 'Calculate Route & Fares' : 'Select Locations'}
          </button>
        )}

        
        {!activeRide && distance && (
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Choose Courier Type
            </label>
            <div className="space-y-2">
              {Object.entries(fareRates)
                .filter(([key, rate]) => rate.service_type === 'package')
                .map(([key, rate]) => {
                  const vehicleFare = allVehicleFares[key];
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleVehicleSelect(key)}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedVehicle === key
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{rate.icon}</span>
                          <div className="text-left">
                            <p className="font-semibold text-white">{rate.name}</p>
                            {distance && duration ? (
                              <p className="text-xs text-white/60">
                                {Math.round(duration)} min • {distance.toFixed(1)} km
                              </p>
                            ) : (
                              <p className="text-xs text-white/60">
                                Select locations first
                              </p>
                            )}
                            {rate.features && (
                              <p className="text-xs text-blue-300 mt-1">
                                {rate.features}
                              </p>
                            )}
                            {rate.max_weight && (
                              <p className="text-xs text-white/60 mt-1">
                                Max: {rate.max_weight}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {vehicleFare ? (
                            <>
                              <p className="font-bold text-white text-lg">
                                KSH {vehicleFare.total?.toLocaleString() || '---'}
                              </p>
                              <p className="text-xs text-white/60">
                                {vehicleFare.surge_multiplier > 1 ? 'Surge pricing' : 'Standard fare'}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-white/60">--</p>
                          )}
                        </div>
                        {selectedVehicle === key && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/30 ml-3">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

       
        {distance && duration && !activeRide && (
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
            <h3 className="font-semibold text-white mb-3">Delivery Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Distance</span>
                <span className="font-bold text-white">
                  {distance.toFixed(2)} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Estimated Time</span>
                <span className="font-bold text-white">
                  {Math.round(duration)} mins
                </span>
              </div>
            </div>
          </div>
        )}

 
{!activeRide && (
  <button
    onClick={() => {
     
      if (!packageDescription || !recipientName || !recipientPhone) {
        setError('Please fill in package description, recipient name and phone');
        return;
      }
      
     
      const packageData = {
        package_description: packageDescription,
        package_size: 'medium', 
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_instructions: deliveryInstructions,
        selected_vehicle: selectedVehicle
      };
      
      handleCourierRequest(packageData);
    }}
    disabled={!fareEstimate || loading || isRequestingRide}
    className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
      fareEstimate && !loading && !isRequestingRide
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-105 border border-blue-400/30'
        : 'bg-gray-600 cursor-not-allowed border border-white/20'
    }`}
  >
    {isRequestingRide ? 'Requesting...' : 
     loading ? 'Calculating...' : 
     fareEstimate ? `Request ${fareRates[selectedVehicle]?.name} - KSH ${fareEstimate.total?.toLocaleString() || '---'}` : 'Enter Locations'}
  </button>
)}
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
              icon={createCustomIcon('#10B981', 'Y')}
            >
              <Popup>Your Current Location</Popup>
            </Marker>
          )}
          
        
          {pickupCoords && (
            <Marker 
              position={pickupCoords}
              icon={createCustomIcon('#3B82F6', 'P')}
            >
              <Popup>Pickup Location</Popup>
            </Marker>
          )}
          
          
          {dropoffCoords && (
            <Marker 
              position={dropoffCoords}
              icon={createCustomIcon('#EF4444', 'D')}
            >
              <Popup>Delivery Location</Popup>
            </Marker>
          )}
          
          
          {driverLocation && (
            <Marker 
              position={[driverLocation.lat, driverLocation.lng]}
              icon={createCustomIcon('#F59E0B', 'C')}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Your Courier</p>
                  {driverInfo && (
                    <p>{driverInfo.first_name} {driverInfo.last_name}</p>
                  )}
                </div>
              </Popup>
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Calculating route...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'profile' && (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
    <div className="p-6 border-b border-white/20">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <User className="w-8 h-8 text-emerald-400" />
        My Profile
      </h2>
      <p className="text-white/60 mt-2">Manage your account and preferences</p>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
<div className="bg-white/5 rounded-xl p-6 border border-white/10">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
    {!isEditingPersonalInfo ? (
      <button
        onClick={handleEditPersonalInfo}
        className="bg-emerald-500/20 text-emerald-300 px-3 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
      >
        
        Edit
      </button>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={handleCancelEdit}
          className="bg-gray-500/20 text-gray-300 px-3 py-2 rounded-lg border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePersonalInfo}
          className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
    )}
  </div>
  
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
        <User className="w-8 h-8 text-white" />
      </div>
      <div>
        {isEditingPersonalInfo ? (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={editPersonalInfo.firstName}
              onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="First Name"
              className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              value={editPersonalInfo.lastName}
              onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Last Name"
              className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
            />
          </div>
        ) : (
          <>
            <p className="text-white font-semibold text-lg">
              {personalInfo.firstName} {personalInfo.lastName}
            </p>
            <p className="text-white/60">Premium Member</p>
          </>
        )}
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-white/60 text-sm mb-2">Email</label>
        {isEditingPersonalInfo ? (
          <input
            type="email"
            value={editPersonalInfo.email}
            onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
          />
        ) : (
          <p className="text-white">{personalInfo.email}</p>
        )}
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-2">Phone</label>
        {isEditingPersonalInfo ? (
          <input
            type="tel"
            value={editPersonalInfo.phone}
            onChange={(e) => setEditPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
          />
        ) : (
          <p className="text-white">{personalInfo.phone}</p>
        )}
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-2">Member Since</label>
        <p className="text-white">January 2024</p>
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-2">Rider Rating</label>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-white">4.8/5.0</span>
        </div>
      </div>
    </div>

   
    <div className="pt-4 border-t border-white/20">
      <label className="block text-white/60 text-sm mb-3">Payment Method</label>
      {isEditingPersonalInfo ? (
        <div className="space-y-3">
          <button
            onClick={() => handlePaymentMethodChange('mpesa')}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              editPersonalInfo.paymentMethod === 'mpesa'
                ? 'border-emerald-400 bg-emerald-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/30'
            }`}
          >
            <Smartphone className="w-6 h-6 text-emerald-400" />
            <div className="text-left">
              <p className="font-semibold text-white">M-Pesa</p>
              <p className="text-xs text-white/60">Pay with Mobile Money</p>
            </div>
            {editPersonalInfo.paymentMethod === 'mpesa' && (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border border-white/30 ml-auto">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
          
          <button
            onClick={() => handlePaymentMethodChange('visa')}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              editPersonalInfo.paymentMethod === 'visa'
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/30'
            }`}
          >
            <CreditCard className="w-6 h-6 text-blue-400" />
            <div className="text-left">
              <p className="font-semibold text-white">Visa/MasterCard</p>
              <p className="text-xs text-white/60">Pay with Credit/Debit Card</p>
            </div>
            {editPersonalInfo.paymentMethod === 'visa' && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/30 ml-auto">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
          personalInfo.paymentMethod === 'mpesa'
            ? 'border-emerald-400 bg-emerald-500/20'
            : 'border-blue-400 bg-blue-500/20'
        }`}>
          {personalInfo.paymentMethod === 'mpesa' ? (
            <>
              <Smartphone className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">M-Pesa</p>
                <p className="text-xs text-white/60">Default payment method</p>
              </div>
            </>
          ) : (
            <>
              <CreditCard className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-semibold text-white">Visa/MasterCard</p>
                <p className="text-xs text-white/60">Default payment method</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
</div>

        
        <div className="space-y-6">
          
<div className="bg-white/5 rounded-xl p-6 border border-white/10">
  <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-white/60">Total Rides</span>
      <span className="text-white font-semibold">{rideHistory.length}</span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-white/60">This Month</span>
      <span className="text-white font-semibold">
        {rideHistory.filter(ride => {
          const rideDate = new Date(ride.created_at);
          const now = new Date();
          return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear();
        }).length}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-white/60">Total Spent</span>
      <span className="text-emerald-300 font-semibold">
        KSH {rideHistory
          .filter(ride => ride.status === 'completed')
          .reduce((total, ride) => total + (parseFloat(ride.fare) || 0), 0)
          .toLocaleString()}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-white/60">Avg. Rating</span>
      <span className="text-yellow-400 font-semibold">
        {rideHistory.length > 0 ? '4.8' : '0.0'} ★
      </span>
    </div>
  </div>
</div>

          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg ${action.color} ${action.borderColor} ${action.textColor}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IconComponent className="w-6 h-6" />
                      <span className="text-sm font-medium text-center">{action.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </main>

      <ChatModal
        showChat={showChat}
        onClose={() => setShowChat(false)}
        chatMessages={chatMessages}
        newMessage={newMessage}
        onMessageChange={(e) => setNewMessage(e.target.value)}
        onSendMessage={sendMessage}
        driverInfo={driverInfo}
        currentUserType="customer"
      />

     
      <EmergencyContactModal
        show={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        contacts={emergencyContacts}
      />

      <ScheduleRideModal
        show={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onScheduleRide={handleScheduledRide}
      />

      <ShareRideModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        activeRide={activeRide}
      />

     
<PaymentMethodsModal
  show={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  paymentDetails={paymentDetails}
  onPaymentChange={handlePaymentChange}
  onSave={savePaymentDetails}
  loading={loading}
/>


<ChatHistoryModal
  show={showChatHistory}
  onClose={() => setShowChatHistory(false)}
  chatHistory={allChatHistory}
/>


{showVoiceAssistant && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
    <div className="bg-gray-900 rounded-2xl border border-white/20 w-full max-w-md">
     
      <div className="flex justify-between items-center p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">Auto Voice Assistant</h3>
            <p className="text-white/60 text-sm">
              {isListening ? 'Listening...' : 
               isProcessing ? 'Processing...' : 
               'I\'ll handle everything automatically'}
            </p>
          </div>
        </div>
      </div>

    
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className={`flex items-center gap-2 ${transcript ? 'text-emerald-400' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              transcript ? 'bg-emerald-500' : 'bg-gray-600'
            }`}>
              {transcript ? '✓' : '1'}
            </div>
            <span>Voice Command</span>
          </div>
          <div className={`flex items-center gap-2 ${isProcessing ? 'text-blue-400' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isProcessing ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              {isProcessing ? '⟳' : '2'}
            </div>
            <span>Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-600">
              3
            </div>
            <span>Ready to Book</span>
          </div>
        </div>
      </div>

     
      <div className="p-6">
       
        <div className="space-y-4">
          
          {transcript && (
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-blue-300 text-sm mb-1 font-medium">You said:</p>
              <p className="text-white">"{transcript}"</p>
            </div>
          )}

          
          {isProcessing && (
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <div className="flex-1">
                  <p className="text-purple-300 text-sm font-medium">Automating your request...</p>
                  <p className="text-purple-200 text-xs">Setting locations • Calculating route • Getting fares</p>
                </div>
              </div>
            </div>
          )}

          
          {!isListening && !isProcessing && transcript && !voiceError && fareEstimate && (
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-300 font-medium">Ready to Book!</p>
              </div>
              <p className="text-emerald-200 text-sm">
                Your {fareRates[selectedVehicle]?.name} to {dropoff} is ready.
                <br />
                <span className="font-bold">Total: KSH {fareEstimate.total?.toLocaleString()}</span>
              </p>
              <button
                onClick={() => {
                  setShowVoiceAssistant(false);
                  
                }}
                className="w-full mt-3 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Close & Review Booking
              </button>
            </div>
          )}
        </div>

        
        <div className="flex justify-center mt-6">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <Square className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

<CourierModal
  show={showCourierModal}
  onClose={() => setShowCourierModal(false)}
  onRequestCourier={handleCourierRequest}
/>
    </div>
  );
  
}

export default CustomerDash;