import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, MapPin, DollarSign, Clock, MessageCircle, Send, Package,
  Navigation, User, Shield, Star, AlertCircle, Bell, X, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverService from '../../services/driverApi';
import websocketService from '../../services/websocketService';
import ChatService from '../../services/chatService';
import RideManagement from './RideManagement';
import Earnings from './Earnings';
import VehicleInfo from './VehicleInfo';
import { Link } from 'react-router-dom';


const calculateDistance = (point1, point2) => {
  if (!point1 || !point2) return 0;
  const R = 6371;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
};

const createCustomIcon = (color, letter) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
           <span style="color: white; font-weight: bold; font-size: 12px;">${letter}</span>
         </div>`,
  className: 'custom-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});


const NotificationBell = ({ notifications, unreadCount, onMarkAsRead, onClearNotification, onMarkAllAsRead, onAcceptRide, onDeclineRide }) => {
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
              notifications.map((notification) => {
                const isCourier = notification.type === 'courier_request';
                const isRide = notification.type === 'ride_request';
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {isRide && <Car className="w-4 h-4 text-green-500" />}
                        {isCourier && <Package className="w-4 h-4 text-blue-500" />}
                        {notification.type === 'ride_accepted' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                        
                        <span className="font-semibold text-gray-800 text-sm">
                          {isCourier ? '📦 Package Delivery' : notification.title}
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
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {isCourier 
                        ? `You have a courier request - ${notification.data.package_description || 'Package delivery'}`
                        : notification.message
                      }
                    </p>
                    
                    
                    {isCourier && notification.data.package_size && (
                      <div className="bg-blue-50 rounded p-2 mb-2">
                        <p className="text-blue-800 text-xs">
                          <strong>Size:</strong> {notification.data.package_size}
                        </p>
                        {notification.data.recipient_name && (
                          <p className="text-blue-800 text-xs">
                            <strong>Recipient:</strong> {notification.data.recipient_name}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>

                   
                    {(isRide || isCourier) && !notification.data?.accepted && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcceptRide(notification.data.id);
                            onMarkAsRead(notification.id);
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm hover:bg-green-600 transition-colors ${
                            isCourier ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                          }`}
                        >
                          {isCourier ? 'Accept Delivery' : 'Accept Ride'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeclineRide(notification.data.id);
                            onMarkAsRead(notification.id);
                          }}
                          className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PersistentNotificationBar = ({ currentNotification, onAcceptRide, onDeclineRide, onClose }) => {
  if (!currentNotification) return null;

  const isCourierRequest = currentNotification.type === 'courier_request' || 
                          currentNotification.requestType === 'courier' ||
                          currentNotification.data?.service_type === 'courier';

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-500">
      <div className={`rounded-2xl shadow-2xl border p-4 ${
        isCourierRequest 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCourierRequest ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {isCourierRequest ? (
              <Package className="w-5 h-5 text-blue-600" />
            ) : (
              <Car className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-semibold ${
                isCourierRequest ? 'text-blue-800' : 'text-green-800'
              }`}>
                {isCourierRequest ? '📦 Package Delivery Request' : '🚗 Ride Request'}
              </h4>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className={`text-sm mb-3 ${
              isCourierRequest ? 'text-blue-700' : 'text-green-700'
            }`}>
              {currentNotification.data.pickup_address} → {currentNotification.data.dropoff_address}
            </p>

            
            {isCourierRequest && currentNotification.data.package_description && (
              <div className={`rounded-lg p-2 mb-3 ${
                isCourierRequest ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <p className={`text-sm font-medium ${
                  isCourierRequest ? 'text-blue-800' : 'text-green-800'
                }`}>
                  📦 {currentNotification.data.package_description}
                </p>
                {currentNotification.data.package_size && (
                  <p className={`text-xs mt-1 ${
                    isCourierRequest ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    Size: {currentNotification.data.package_size}
                  </p>
                )}
                {currentNotification.data.recipient_name && (
                  <p className={`text-xs mt-1 ${
                    isCourierRequest ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    Recipient: {currentNotification.data.recipient_name}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className={`text-lg font-bold ${
                isCourierRequest ? 'text-blue-800' : 'text-green-800'
              }`}>
                Ksh {currentNotification.data.fare}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDeclineRide(currentNotification.data.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => {
                    onAcceptRide(currentNotification.data.id);
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-colors ${
                    isCourierRequest 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isCourierRequest ? 'Accept Delivery' : 'Accept Ride'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const DriverChatModal = ({ 
    showChat, 
    onClose, 
    chatMessages, 
    newMessage, 
    onMessageChange, 
    onSendMessage, 
    customerInfo, 
    currentRide 
}) => {
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
                        <h3 className="font-bold text-gray-800">Chat with Customer</h3>
                        {customerInfo && (
                            <p className="text-sm text-gray-600">
                                {customerInfo.first_name} {customerInfo.last_name}
                                {currentRide && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        • Ride #{currentRide.id}
                                    </span>
                                )}
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
                            <p className="text-sm">Start a conversation with your customer</p>
                        </div>
                    ) : (
                        chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`mb-3 ${msg.sender === 'driver' ? 'text-right' : 'text-left'}`}
                            >
                                <div
                                    className={`inline-block px-4 py-2 rounded-2xl max-w-xs ${
                                        msg.sender === 'driver'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}
                                >
                                    <p className="text-sm">{msg.message}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {msg.sender === 'driver' ? 'You' : msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString()}
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
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" /> 
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};


const DriverDash = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [hasTriedConnecting, setHasTriedConnecting] = useState(false);
    
   
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentNotification, setCurrentNotification] = useState(null);
    const [showPersistentNotification, setShowPersistentNotification] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentChatRide, setCurrentChatRide] = useState(null);
    const wsInitializedRef = useRef(false);
    const isMountedRef = useRef(true);
    const locationWatchIdRef = useRef(null);
    const connectionCheckIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);
    const dashboardDataRef = useRef(null);
    const [pendingRides, setPendingRides] = useState([]);
    const [loadingPendingRides, setLoadingPendingRides] = useState(false);

    useEffect(() => { dashboardDataRef.current = dashboardData; }, [dashboardData]);

    
    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            ...notification,
            read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        
        try { new Audio('/notification.mp3').play().catch(() => {}); } catch {}
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

    const showPersistentNotificationBar = (data, requestType = 'ride') => {
  setCurrentNotification({
    type: requestType === 'courier' ? 'courier_request' : 'ride_request',
    data: data,
    requestType: requestType, 
    timestamp: new Date()
  });
  setShowPersistentNotification(true);
  
  setTimeout(() => {
    if (isMountedRef.current) {
      setShowPersistentNotification(false);
    }
  }, 30000);
};

   
const sendMessage = async () => {
  if (!newMessage.trim() || !currentChatRide) {
    console.log('❌ [Chat] Cannot send - no message or no ride');
    return;
  }

  try {
    
    const customerId = currentChatRide.customer_id || 
                      currentChatRide.customer?.id || 
                      currentChatRide.customer;

    console.log('💬 [Chat DEBUG] Starting to send message:', {
      message: newMessage,
      rideId: currentChatRide.id,
      customerId: customerId,
      currentChatRide: currentChatRide
    });

    if (!customerId) {
      console.error('❌ [Chat] No customerId found in currentChatRide:', currentChatRide);
      return;
    }

    await ChatService.sendDriverMessage(
      currentChatRide.id, 
      newMessage, 
      customerId
    );

    console.log('✅ [Chat DEBUG] Message sent successfully');

    
    const sentMessage = {
      id: Date.now() + Math.random(),
      message: newMessage,
      sender: 'driver',
      timestamp: new Date().toISOString(),
      sender_name: sessionStorage.getItem('user_name') || 'You',
      isCurrentUser: true,
      ride_id: currentChatRide.id
    };

    setChatMessages(prev => [...prev, sentMessage]);
    setNewMessage('');

  } catch (error) {
    console.error('❌ [Chat] Error sending message:', error);
  }
};

const openChat = (ride) => {
  setCurrentChatRide({
    ...ride,
    customer_id: ride.customer_id || ride.customer?.id
  });
  setShowChat(true);

  setNotifications(prev => 
    prev.filter(notif => !(notif.type === 'chat_message' && notif.data?.ride_id === ride.id))
  );
  setUnreadCount(prev => Math.max(0, prev - 1));
};

    
    const handleConnectionEstablished = () => {
        console.log('✅ WebSocket connected');
        setConnectionState('connected');
        setHasTriedConnecting(true);
        fetchDashboardData();
    };

  

const handleChatMessage = (data) => {
  console.log('💬 [Driver] New chat message received:', data);
  
  
  const formattedMessage = {
    id: Date.now() + Math.random(),
    message: data.message,
    sender: 'customer',
    timestamp: data.timestamp || new Date().toISOString(),
    sender_name: data.sender_name || 'Customer',
    ride_id: data.ride_id
  };

  console.log('✅ [Driver] Formatted message:', formattedMessage);
  setChatMessages(prev => [...prev, formattedMessage]);
  
  
  if (!showChat) {
    addNotification({
      type: 'customer_message',
      title: 'New Message from Customer',
      message: data.message,
      data: data
    });
  }
};

    const handleNewRideRequest = (data) => {
        console.log('🛎 New ride request:', data);
        
        
        addNotification({
            type: 'ride_request',
            title: 'New Ride Request',
            message: `${data.pickup_address} → ${data.dropoff_address}`,
            data: data
        });
        
        
        showPersistentNotificationBar(data);
    };

    const handleRideAcceptedSelf = (data) => {
        console.log('🎯 Ride accepted - updating dashboard', data);
        
       
        addNotification({
            type: 'ride_accepted',
            title: 'Ride Accepted',
            message: `You accepted ride from ${data.customer_name}`,
            data: data
        });
        
        fetchDashboardData();
    };

    const handleRideTaken = (data) => {
        console.log('Ride taken by another driver', data);
        
        setShowPersistentNotification(false);
    };

    const handleRideStatusUpdate = () => {
        console.log('🔄 Ride status updated - refreshing dashboard');
        fetchDashboardData();
    };

    const handleLocationUpdate = (data) => console.log('📍 Location update:', data);
    

const setupWebSocket = async () => {
  console.log('🟡 [DriverDash] ========== SETUP WEBSOCKET START ==========');
  
  const token = sessionStorage.getItem('access_token');
  const driverId = sessionStorage.getItem('user_id');
  const userType = sessionStorage.getItem('user_type');

  console.log(`🟡 [DriverDash] Credentials - driverId: ${driverId}, userType: ${userType}, hasToken: ${!!token}`);

  if (!driverId || !token || !['driver', 'boda_rider'].includes(userType)) {
    console.log('❌ [DriverDash] Missing credentials or wrong user type');
    setConnectionState('error');
    return;
  }

  try {
   
    console.log('🟡 [DriverDash] Clearing all handlers...');
    websocketService.clearAllHandlers();

    
    console.log('🟡 [DriverDash] Registering handlers...');

   
    websocketService.onMessage('new_ride_request', (data) => {
      console.log('🚗 [DriverDash] ========== NEW RIDE REQUEST HANDLER CALLED ==========');

      const isCourierRequest = data.service_type === 'courier' || 
                          data.request_type === 'courier' ||
                          data.vehicle_type?.includes('courier');
  
  const requestType = isCourierRequest ? 'courier' : 'ride';
  
  console.log(`📦 [DriverDash] Request type: ${requestType}`, data);
      
      const formattedData = {
    id: data.id || data.ride_id,
    ride_id: data.ride_id || data.id,
    customer_name: data.customer_name || 'Unknown Customer',
    customer_phone: data.customer_phone || 'N/A',
    pickup_address: data.pickup_address || 'Unknown',
    dropoff_address: data.dropoff_address || 'Unknown',
    fare: parseFloat(data.fare) || 0,
    vehicle_type: data.vehicle_type || (isCourierRequest ? 'courier' : 'economy'),
    service_type: data.service_type || requestType,
    request_type: requestType, 
    distance_to_pickup_km: parseFloat(data.distance) || 0,
    estimated_pickup_time: data.estimated_pickup_time || 'Unknown',
    created_at: data.created_at || new Date().toISOString(),
    
    
    ...(isCourierRequest && {
      package_description: data.package_description,
      package_size: data.package_size,
      recipient_name: data.recipient_name,
      recipient_phone: data.recipient_phone,
      delivery_instructions: data.delivery_instructions
    })
  };

      console.log('🚗 [DriverDash] Formatted data:', formattedData);
  if (isCourierRequest) {
    handleCourierRequest(formattedData);
  } else {
    handleRideRequest(formattedData);
  }
});


const handleCourierRequest = (data) => {
  console.log('📦 [DriverDash] Processing courier request:', data);
  
  addNotification({
    type: 'courier_request', 
    title: '📦 Package Delivery Request',
    message: `You have a courier request - ${data.package_description || 'Package delivery'}`,
    data: data
  });
  
  showPersistentNotificationBar(data, 'courier');
};


const handleRideRequest = (data) => {
  console.log('🚗 [DriverDash] Processing ride request:', data);
  
  addNotification({
    type: 'ride_request', 
    title: '🚗 Ride Request',
    message: `${data.pickup_address} → ${data.dropoff_address}`,
    data: data
  });
  
  showPersistentNotificationBar(data, 'ride');
};

    
    websocketService.onMessage('customer_message', (data) => {
      console.log('💬 [DriverDash] Customer message received:', data);
      handleChatMessage(data);
    });

   
    websocketService.onMessage('ride_accepted_self', (data) => {
      console.log('🎯 [DriverDash] Ride accepted confirmation:', data);
      handleRideAcceptedSelf(data);
    });

    websocketService.onMessage('ride_taken', (data) => {
      console.log('🚫 [DriverDash] Ride taken by another driver:', data);
      handleRideTaken(data);
    });

    websocketService.onMessage('ride_status_update', (data) => {
      console.log('🔄 [DriverDash] Ride status update:', data);
      handleRideStatusUpdate(data);
    });

    websocketService.onMessage('driver_arrived', (data) => {
      console.log('✅ [DriverDash] Driver arrived:', data);
      
    });

    websocketService.onMessage('ride_declined', (data) => {
      console.log('❌ [DriverDash] Ride declined:', data);
     
    });

    websocketService.onMessage('location_update', (data) => {
      console.log('📍 [DriverDash] Location update:', data);
      handleLocationUpdate(data);
    });

    
    websocketService.onMessage('connection_established', () => {
      console.log('✅ [DriverDash] Connection established');
      setConnectionState('connected');
      setHasTriedConnecting(true);
      fetchDashboardData();
    });

    
    websocketService.onMessage('*', (data, type) => {
      console.log(`🔍 [DEBUG] Received ${type}:`, data);
    });

    
    console.log('🟡 [DriverDash] Connecting to WebSocket...');
    setConnectionState('connecting');
    
    await websocketService.connect(userType, driverId, token);
    
    console.log('✅ [DriverDash] WebSocket connection completed');

  } catch (error) {
    console.error('❌ [DriverDash] WebSocket setup error:', error);
    setConnectionState('error');
    setHasTriedConnecting(true);
  }

  console.log('🟡 [DriverDash] ========== SETUP WEBSOCKET END ==========');
};


useEffect(() => {
  console.log('🟡 [DriverDash] Component mounting');
  isMountedRef.current = true;

 
  setupWebSocket();

  
  fetchDashboardData();

 
  startLocationTracking();

  
  connectionCheckIntervalRef.current = setInterval(() => {
    if (!isMountedRef.current) return;

    const state = websocketService.getConnectionState();
    console.log(`🔍 [DriverDash] Connection state check: ${state}`);
    
    if (state !== 'connected') {
      setConnectionState(state);
    }

   
    if (state === 'disconnected' && !websocketService.isConnecting) {
      console.log('🔄 [DriverDash] Reconnecting...');
      wsInitializedRef.current = false;
      setupWebSocket();
    }
  }, 5000);


  return () => {
    console.log('🟡 [DriverDash] Component unmounting - cleanup');
    isMountedRef.current = false;
    
    clearInterval(connectionCheckIntervalRef.current);
    
    if (locationWatchIdRef.current) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    
    websocketService.clearComponentHandlers('DriverDash');
  };
}, []); 




const fetchAvailableRides = async () => {
    try {
        setLoadingPendingRides(true);
        const rides = await DriverService.getAvailableRides();
        if (isMountedRef.current) {
            setPendingRides(rides || []);
        }
    } catch (err) {
        console.error(' [Fetch Rides] Error:', err);
        if (isMountedRef.current) {
            setPendingRides([]);
        }
    } finally {
        if (isMountedRef.current) {
            setLoadingPendingRides(false);
        }
    }
};

  
{dashboardData?.user?.approval_status && dashboardData.user.approval_status !== 'approved' && (
    <div className={`px-6 py-4 text-center border-b ${
        dashboardData.user.approval_status === 'pending'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
    }`}>
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4">
               
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    dashboardData.user.approval_status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                }`}>
                    {dashboardData.user.approval_status === 'pending' ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                </div>
                
                
                <div className="text-left flex-1">
                    <h3 className={`font-semibold ${
                        dashboardData.user.approval_status === 'pending'
                            ? 'text-yellow-300'
                            : 'text-red-300'
                    }`}>
                        {dashboardData.user.approval_status === 'pending' 
                            ? 'Application Under Review' 
                            : `Account ${dashboardData.user.approval_status.charAt(0).toUpperCase() + dashboardData.user.approval_status.slice(1)}`
                        }
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                        {dashboardData.user.approval_status === 'pending' ? (
                            <>Your driver application is being reviewed. This usually takes <strong>24-48 hours</strong>. You can view the dashboard but cannot go online until approved.</>
                        ) : dashboardData.user.approval_status === 'rejected' ? (
                            <>Your application was not approved{dashboardData.user.rejection_reason && <>. <strong>Reason:</strong> {dashboardData.user.rejection_reason}</>}. Contact support to reapply.</>
                        ) : (
                            <>Your account requires attention. Please contact support for assistance.</>
                        )}
                    </p>
                </div>
                
                
                <div className="flex gap-2">
                    {dashboardData.user.approval_status === 'rejected' ? (
                        <button className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20">
                            Contact Support
                        </button>
                    ) : (
                        <button className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20">
                            Check Status
                        </button>
                    )}
                </div>
            </div>
            
            
            {dashboardData.user.approval_status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center max-w-md mx-auto">
                        {[
                            { step: 1, label: 'Applied', completed: true },
                            { step: 2, label: 'Review', completed: true },
                            { step: 3, label: 'Approval', completed: false }
                        ].map((item, index) => (
                            <div key={item.step} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                    item.completed 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-white/10 text-white/60'
                                }`}>
                                    {item.completed ? '✓' : item.step}
                                </div>
                                <span className="text-white/60 text-xs mt-1">{item.label}</span>
                                {index < 2 && (
                                    <div className={`h-0.5 w-16 -mt-4 -mx-8 z-10 ${
                                        item.completed ? 'bg-emerald-500' : 'bg-white/10'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
)}

    
    const updateDriverLocation = async (location) => {
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 15000) return;
        lastUpdateTimeRef.current = now;

        const isOnline = dashboardDataRef.current?.driver_status?.is_online;
        if (!isOnline) return;

        try {
            await DriverService.updateDriverLocation({ lat: location.lat, lng: location.lng, is_online: isOnline });
            if (dashboardDataRef.current?.current_ride) {
                websocketService.sendMessage('location_update', {
                    ride_id: dashboardDataRef.current.current_ride.id,
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (err) { console.error(err); }
    };

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            console.log('❌ [Location] Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!isMountedRef.current) return;
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentLocation(loc);
                updateDriverLocation(loc);
                console.log('📍 [Location] Current position obtained');
            },
            (error) => {
                console.log('❌ [Location] Error getting position:', error.message);
                if (error.code === error.PERMISSION_DENIED) {
                    console.log('📍 [Location] Please enable location permissions in your browser');
                }
            }
        );

        locationWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (!isMountedRef.current) return;
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentLocation(loc);
                if (dashboardDataRef.current?.driver_status?.is_online) {
                    updateDriverLocation(loc);
                }
            },
            (error) => {
                console.log('❌ [Location] Error watching position:', error.message);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000,
                maximumAge: 30000 
            }
        );
    };


 useEffect(() => {
  console.log('🟡 [DriverDash] Component mounting');
  isMountedRef.current = true;

 
  console.log('🟡 [DriverDash] Setting up WebSocket...');
  setupWebSocket();

  
  fetchDashboardData().then(() => {
    console.log('✅ [DriverDash] Initial data loaded');
  });

  
  startLocationTracking();

  
  connectionCheckIntervalRef.current = setInterval(() => {
    if (!isMountedRef.current) return;
    const state = websocketService.getConnectionState?.() || 'disconnected';
    setConnectionState(state);

    if (state === 'disconnected' && !websocketService.isConnecting) {
      console.log('🔄 [Connection Check] WebSocket disconnected, reconnecting...');
      setupWebSocket();
    }
  }, 5000);

  return () => {
    console.log('🟡 [DriverDash] Component unmounting - cleanup');
    isMountedRef.current = false;
    clearInterval(connectionCheckIntervalRef.current);
    if (locationWatchIdRef.current) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }
    
   
    websocketService.clearComponentHandlers('DriverDash');
  };
}, []);

  
    useEffect(() => {
        if (dashboardData?.driver_status?.is_online && !dashboardData?.current_ride) {
            console.log('🔄 [Auto-Refresh] Starting available rides refresh every 10 seconds');
            const interval = setInterval(fetchAvailableRides, 10000); 
            
            
            fetchAvailableRides();
            
            return () => {
                console.log('🔄 [Auto-Refresh] Stopping available rides refresh');
                clearInterval(interval);
            };
        } else {
            
            if (!dashboardData?.driver_status?.is_online || dashboardData?.current_ride) {
                setPendingRides([]);
            }
        }
    }, [dashboardData?.driver_status?.is_online, dashboardData?.current_ride]);


   const acceptRide = async (rideId) => {
    try {
        console.log(`🟡 [Driver] Accepting ride: ${rideId}`);
        
        await DriverService.acceptRide(rideId);
        setShowPersistentNotification(false);
        
        
        await fetchDashboardData();
        
        
        const driverData = dashboardDataRef.current;
        const driverInfo = {
            driver_id: sessionStorage.getItem('user_id'),
            driver_name: `${driverData?.user?.first_name || ''} ${driverData?.user?.last_name || ''}`.trim(),
            driver_phone: driverData?.user?.phone_number || '',
            vehicle_type: driverData?.vehicle_info?.vehicle_type || '',
            license_plate: driverData?.vehicle_info?.license_plate || '',
            timestamp: new Date().toISOString()
        };

        console.log('📢 [Driver] Notifying customer about acceptance:', driverInfo);
        
        
        websocketService.sendRideMessage(rideId, 'ride_accepted', driverInfo);
        
    } catch (err) { 
        console.error('❌ [Driver] Error accepting ride:', err); 
        setError('Failed to accept ride'); 
    }
};

    const declineRide = async (rideId) => {
    try { 
        console.log('🟡 [Driver] Declining ride:', rideId);
        await DriverService.declineRide(rideId); 
        
        
        websocketService.sendRideMessage(rideId, 'ride_declined', {
            driver_id: sessionStorage.getItem('user_id'),
            driver_name: `${dashboardDataRef.current?.user?.first_name || ''} ${dashboardDataRef.current?.user?.last_name || ''}`.trim(),
            timestamp: new Date().toISOString(),
            message: 'Driver declined the ride request'
        });
        
        setShowPersistentNotification(false);
        
        
        setPendingRides(prev => prev.filter(ride => ride.id !== rideId));
        
        console.log('✅ [Driver] Ride declined and customer notified');
        
    } catch (err) { 
        console.error('❌ [Driver] Error declining ride:', err); 
        setError('Failed to decline ride');
    }
};

    const handleRideAction = async (rideId, action) => {
        let newStatus = '';
        try {
            if (action === 'arrived') { await DriverService.updateRideStatus(rideId, 'driver_arrived'); newStatus = 'driver_arrived'; }
            if (action === 'start') { await DriverService.startRide(rideId); newStatus = 'in_progress'; }
            if (action === 'complete') { await DriverService.completeRide(rideId); newStatus = 'completed'; }
            if (newStatus) websocketService.sendMessage('ride_status_update', { ride_id: rideId, status: newStatus, timestamp: new Date().toISOString() });
            fetchDashboardData();
        } catch (err) { console.error(err); }
    };

    
   const fetchDashboardData = async () => {
    try { 
        setLoading(true); 
        setError(''); 
        const data = await DriverService.getDashboard(); 
        if (isMountedRef.current) {
            setDashboardData(data); 
            
            if (data?.driver_status?.is_online) {
                fetchAvailableRides();
            }
        }
    } catch (err) { 
        if (isMountedRef.current) setError(err.error || err.message || 'Failed to load dashboard'); 
    } finally { 
        if (isMountedRef.current) setLoading(false); 
    }
};

  const toggleOnlineStatus = async (isOnline) => { 
    try { 
        console.log(`🟡 [Toggle Status] Setting online status to: ${isOnline}`);
        
        
        if (isOnline && dashboardData?.user?.approval_status && dashboardData.user.approval_status !== 'approved') {
            let message = 'Your driver account is ';
            if (dashboardData?.user?.approval_status === 'pending') {
                message += 'pending approval. Please wait for admin approval.';
            } else if (dashboardData?.user?.approval_status === 'rejected') {
                message += 'rejected. Contact support for more information.';
                if (dashboardData?.user?.rejection_reason) {
                    message += ` Reason: ${dashboardData.user.rejection_reason}`;
                }
            } else if (dashboardData?.user?.approval_status === 'suspended') {
                message += 'suspended. Contact support for more information.';
            } else {
                message += 'not approved. Please contact support.';
            }
            
            setError(message);
            return;
        }
        
       
        const locationData = {};
        if (currentLocation) {
            locationData.lat = currentLocation.lat;
            locationData.lng = currentLocation.lng;
        } else {
           
            locationData.lat = -1.2921;
            locationData.lng = 36.8219;
        }
        
        const result = await DriverService.toggleOnlineStatus({
            is_online: isOnline,
            ...locationData
        });
        
        console.log('✅ [Toggle Status] Success:', result);
        
       
        fetchDashboardData();
        
       
        if (isOnline) {
            console.log('🔄 [Toggle Status] Fetching available rides...');
            fetchAvailableRides();
            
            if (connectionState !== 'connected') {
                console.log('🔄 [Toggle Status] Ensuring WebSocket connection...');
                setupWebSocket();
            }
        } else {
            
            setPendingRides([]);
        }
        
    } catch (err) { 
        console.error('❌ [Toggle Status] Error:', err);
        setError(err.error || 'Failed to update status'); 
    }  
};

    
    if (loading) return <div className="text-white p-4">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
           
            {hasTriedConnecting && connectionState === 'disconnected' && (
                <div className="bg-red-500/20 text-red-300 px-4 py-2 text-center text-sm">
                    🔴 Disconnected from server - Attempting to reconnect...
                </div>
            )}
            {connectionState === 'error' && (
                <div className="bg-red-500/20 text-red-300 px-4 py-2 text-center text-sm">
                    ❌ Connection error - Please refresh the page
                </div>
            )}

            
{dashboardData?.user?.approval_status && dashboardData.user.approval_status !== 'approved' && (
    <div className={`px-4 py-3 text-center text-sm ${
        dashboardData.user.approval_status === 'pending'
            ? 'bg-yellow-500/20 text-yellow-300 border-b border-yellow-500/30'
            : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
    }`}>
        {dashboardData.user.approval_status === 'pending' ? (
            <>
                ⏳ Your driver account is <strong>pending approval</strong>. 
                You can view the dashboard but cannot go online or accept rides until approved.
            </>
        ) : dashboardData.user.approval_status === 'rejected' ? (
            <>
                ❌ Your driver account was <strong>rejected</strong>. 
                {dashboardData.user.rejection_reason && ` Reason: ${dashboardData.user.rejection_reason}`}
                Contact support for more information.
            </>
        ) : (
            <>
                ⚠️ Your driver account is <strong>{dashboardData.user.approval_status}</strong>. 
                Contact support for more information.
            </>
        )}
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
                                <span className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                                    Ryde Driver
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            
                            <NotificationBell
                                notifications={notifications}
                                unreadCount={unreadCount}
                                onMarkAsRead={markAsRead}
                                onClearNotification={clearNotification}
                                onMarkAllAsRead={markAllAsRead}
                                onAcceptRide={acceptRide}
                                onDeclineRide={declineRide}
                            />

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

                              {dashboardData?.user?.approval_status && (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        dashboardData.user.approval_status === 'approved' 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : dashboardData.user.approval_status === 'pending'
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
    }`}>
        {dashboardData.user.approval_status.toUpperCase()}
    </span>
)}
    
                            </div>

                            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 border border-white/20">
                                <User className="w-5 h-5 text-white/70" />
                                <span className="text-white font-medium">
                                    {dashboardData?.user?.first_name} {dashboardData?.user?.last_name}
                                </span>
                            </div>
                        </div>
                    </div>

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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'dashboard' && (
                    <DashboardView 
                        data={dashboardData} 
                        onStatusUpdate={fetchDashboardData}
                        onRideAction={handleRideAction}
                        currentLocation={currentLocation}
                        notifications={notifications}
      onOpenChat={openChat}
       pendingRides={pendingRides}
        loadingPendingRides={loadingPendingRides}
        onAcceptRide={acceptRide}
         onFetchAvailableRides={fetchAvailableRides}
                    />
                )}
                {activeTab === 'rides' && <RideManagement />}
                {activeTab === 'earnings' && <Earnings />}
                {activeTab === 'vehicle' && <VehicleInfo />}
            </main>

            <DriverChatModal
                showChat={showChat}
                onClose={() => setShowChat(false)}
                chatMessages={chatMessages}
                newMessage={newMessage}
                onMessageChange={(e) => setNewMessage(e.target.value)}
                onSendMessage={sendMessage}
                customerInfo={dashboardData?.current_ride ? {
                    first_name: dashboardData.current_ride.customer_name?.split(' ')[0] || 'Customer',
                    last_name: dashboardData.current_ride.customer_name?.split(' ')[1] || '',
                } : null}
                currentUserType="driver"
                currentRide={currentChatRide}
            />

            {showPersistentNotification && (
                <PersistentNotificationBar
                    currentNotification={currentNotification}
                    onAcceptRide={acceptRide}
                    onDeclineRide={declineRide}
                    onClose={() => setShowPersistentNotification(false)}
                />
            )}
        </div>
    );
};

 
const DashboardView = ({ data, onStatusUpdate, onRideAction, currentLocation, notifications, onOpenChat, pendingRides = [],
    loadingPendingRides = false,
    onAcceptRide, onFetchAvailableRides}) => {
      const dashboardData = data;

      
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
      
      {dashboardData?.user?.approval_status && dashboardData.user.approval_status !== 'approved' && (
        <div className={`rounded-2xl p-6 border ${
            dashboardData.user.approval_status === 'pending'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                dashboardData.user.approval_status === 'pending'
                    ? 'bg-yellow-500/20'
                    : 'bg-red-500/20'
            }`}>
              {dashboardData.user.approval_status === 'pending' ? (
                <Clock className="w-6 h-6 text-yellow-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <p className={`font-semibold ${
                  dashboardData.user.approval_status === 'pending'
                      ? 'text-yellow-300'
                      : 'text-red-300'
              }`}>
                Account {dashboardData.user.approval_status === 'pending' ? 'Pending Approval' : 'Not Approved'}
              </p>
              <p className="text-white/60 text-sm">
                {dashboardData.user.approval_status === 'pending' 
                  ? 'Your driver application is under review. You will be notified once approved.'
                  : dashboardData.user.approval_status === 'rejected'
                  ? `Your application was rejected.${dashboardData.user.rejection_reason ? ` Reason: ${dashboardData.user.rejection_reason}` : ''}`
                  : 'Your account status requires attention. Please contact support.'
                }
              </p>
            </div>
          </div>
        </div>
      )}


    
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

    
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    
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
                    {data.current_ride && (
     <button 
    onClick={() => onOpenChat(data.current_ride)}
    className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
  >
    <MessageCircle className="w-4 h-4" />
    Chat
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

       
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Navigation Map
          </h3>
          
          <div className="rounded-xl overflow-hidden" style={{ height: '400px' }}>
            <MapContainer 
              center={currentLocation || [-1.2921, 36.8219]} 
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {currentLocation && (
                <Marker 
                  position={[currentLocation.lat, currentLocation.lng]} 
                  icon={createCustomIcon('#10B981', 'Y')}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">Your Location</p>
                      <p className="text-xs text-gray-600">Currently here</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {data?.current_ride?.pickup_latitude && data?.current_ride?.pickup_longitude && (
                <Marker 
                  position={[
                    parseFloat(data.current_ride.pickup_latitude), 
                    parseFloat(data.current_ride.pickup_longitude)
                  ]} 
                  icon={createCustomIcon('#3B82F6', 'P')}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">Pickup Location</p>
                      <p className="text-xs text-gray-600">{data.current_ride.pickup_address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {data?.current_ride?.dropoff_latitude && data?.current_ride?.dropoff_longitude && (
                <Marker 
                  position={[
                    parseFloat(data.current_ride.dropoff_latitude), 
                    parseFloat(data.current_ride.dropoff_longitude)
                  ]} 
                  icon={createCustomIcon('#EF4444', 'D')}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">Dropoff Location</p>
                      <p className="text-xs text-gray-600">{data.current_ride.dropoff_address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">Current Position</p>
              <p className="text-white font-medium text-sm">
                {currentLocation 
                  ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : 'Not available'
                }
              </p>
            </div>
            
            {data?.current_ride && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/60 text-xs">Distance to Pickup</p>
                <p className="text-white font-medium text-sm">
                  {calculateDistance(
                    currentLocation,
                    {
                      lat: parseFloat(data.current_ride.pickup_latitude),
                      lng: parseFloat(data.current_ride.pickup_longitude)
                    }
                  )} km
                </p>
              </div>
            )}
          </div>
        </div>

{dashboardData?.driver_status?.is_online && !dashboardData?.current_ride && (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                Available Rides 
                {pendingRides.length > 0 && (
                    <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        {pendingRides.length} NEW
                    </span>
                )}
            </h3>
            <button 
                onClick={onFetchAvailableRides}
                disabled={loadingPendingRides}
                className="text-emerald-300 hover:text-emerald-200 text-sm flex items-center gap-1 disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${loadingPendingRides ? 'animate-spin' : ''}`} />
                Refresh
            </button>
        </div>
        
        {loadingPendingRides ? (
            <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-white/60">Scanning for ride requests...</p>
            </div>
        ) : pendingRides.length === 0 ? (
            <div className="text-center py-8">
                <Car className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-2">No rides available</p>
                <p className="text-white/40 text-sm">Ride requests will appear here when customers book</p>
                <p className="text-white/30 text-xs mt-2">Make sure your location is enabled</p>
            </div>
        ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingRides.map((ride, index) => {
  const isCourierRequest = ride.service_type === 'courier' || 
                          ride.request_type === 'courier' ||
                          ride.vehicle_type?.includes('courier');
                    <div 
                        key={ride.id} 
                        className="bg-white/5 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:bg-white/10"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-emerald-300" />
                                    <p className="font-semibold text-white text-lg">{ride.customer_name}</p>
                                </div>
                                <p className="text-white/60 text-sm">{ride.customer_phone}</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                                    {ride.distance_to_pickup_km ? `${ride.distance_to_pickup_km} km away` : 'Nearby'}
                                </span>
                                {ride.estimated_pickup_time && (
                                    <p className="text-white/50 text-xs mt-1">{ride.estimated_pickup_time}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-white/80">
                                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                <span className="truncate">📍 {ride.pickup_address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                                <span className="truncate">🎯 {ride.dropoff_address}</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                            <div>
                                <span className="text-emerald-300 font-bold text-xl">
                                    KSH {ride.fare}
                                </span>
                                {ride.vehicle_type && (
                                    <p className="text-white/50 text-xs mt-1">{ride.vehicle_type.toUpperCase()}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                       
                                        console.log('Decline ride:', ride.id);
                                        setPendingRides(prev => prev.filter(r => r.id !== ride.id));
                                    }}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => onAcceptRide(ride.id)}
                                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-semibold flex items-center gap-2"
                                >
                                    <Car className="w-4 h-4" />
                                    Accept Ride
                                </button>
                            </div>
                        </div>
                    </div>
    
    })}
            </div>
        )}
    </div>
)}

<div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-4">
        <button 
            onClick={() => window.location.href = '/driver/location'}
            className="bg-emerald-500/20 text-emerald-300 p-4 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all group"
        >
            <MapPin className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Update Location</span>
        </button>
        
        
        <button 
      onClick={() => data?.current_ride && onOpenChat(data.current_ride)}
      disabled={!data?.current_ride}
      className={`p-4 rounded-xl border transition-all group ${
        data?.current_ride
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
          : 'bg-gray-500/20 text-gray-400 border-gray-500/30 cursor-not-allowed'
      }`}
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
        
        {notifications?.some(n => n.type === 'chat_message' && n.data?.ride_id === data?.current_ride?.id) && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </div>
      <span className="text-sm font-medium">
        {data?.current_ride ? 'Chat' : 'No Active Ride'}
      </span>
    </button>
        
       <button 
      onClick={() => window.location.href = '/driver/earnings'}
      className="bg-yellow-500/20 text-yellow-300 p-4 rounded-xl border border-yellow-500/30 hover:bg-yellow-500/30 transition-all group"
    >
      <DollarSign className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">Earnings</span>
    </button>
    
    <button 
      onClick={() => window.location.href = '/driver/profile'}
      className="bg-purple-500/20 text-purple-300 p-4 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-all group"
    >
      <User className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">Profile</span>
    </button>
  </div>
  
  
  {data?.current_ride && (
    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-300 text-sm font-medium">Quick Chat Available</p>
          <p className="text-blue-200 text-xs">
            Chat with {data.current_ride.customer_name}
          </p>
        </div>
        <button
          onClick={() => onOpenChat(data.current_ride)}
          className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <MessageCircle className="w-3 h-3" />
          Open Chat
        </button>
      </div>
    </div>
  )}
</div>
    </div>
    </div>
  );
};


export default DriverDash;