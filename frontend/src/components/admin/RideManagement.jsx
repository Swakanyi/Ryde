import React, { useState, useEffect, useRef} from 'react';
import { 
  Car, Search, Filter, MapPin, Clock, DollarSign, Trash2,
  User, Navigation, Calendar, MoreVertical, Eye, MessageCircle
} from 'lucide-react';
import AdminService from '../../services/adminService';
import RideDetailsModal from './RideDetailsModal';
import ChatHistoryModal from './ChatHistoryModal';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';

const RideManagement = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
const [selectedRide, setSelectedRide] = useState(null);
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [showChatModal, setShowChatModal] = useState(false);
const [deleting, setDeleting] = useState(false);
const menuRef = useRef(null);
  const [filters, setFilters] = useState({
    status: '',
    vehicle_type: '',
    search: ''
  });

  const fetchRides = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getRides(filters);
      setRides(data.rides || []);
    } catch (err) {
      setError(err.error || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filters]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(null);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Requested' },
      accepted: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Accepted' },
      driver_arrived: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Driver Arrived' },
      in_progress: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'In Progress' },
      completed: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.requested;
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${config.color}`}>
        {config.label}
      </span>
    );
  };

const handleMenuToggle = (rideId, event) => {
  event.stopPropagation();
  console.log('Setting menuOpen to:', rideId, 'current:', menuOpen);
  setMenuOpen(prev => prev === rideId ? null : rideId);
};

useEffect(() => {
  console.log('menuOpen state changed to:', menuOpen);
}, [menuOpen]);


const handleViewDetails = (ride) => {
  console.log('View Details clicked for ride:', ride);
  setMenuOpen(null);
  setSelectedRide(ride);
  setShowDetailsModal(true);
};

const handleViewChat = (ride) => {
  console.log('View Chat clicked for ride:', ride);
  setMenuOpen(null);
  setSelectedRide(ride);
  setShowChatModal(true);
};

const handleDelete = async (ride) => {
  console.log('Delete clicked for ride:', ride);
  if (!window.confirm(`Are you sure you want to delete Ride #${ride.id}? This action cannot be undone.`)) {
    return;
  }

  try {
    setDeleting(true);
    await AdminService.deleteRide(ride.id);
    await fetchRides();
    setMenuOpen(null);
  } catch (err) {
    setError(err.error || 'Failed to delete ride');
  } finally {
    setDeleting(false);
  }
};

  const getVehicleIcon = (vehicleType) => {
    const icons = {
      economy: Car,
      comfort: Car,
      premium: Car,
      xl: Car,
      boda: Navigation
    };
    const Icon = icons[vehicleType] || Car;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) return <div className="text-white p-4">Loading rides...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Ride Management</h1>
          <p className="text-white/60">Monitor and manage all ride requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            
            <div>
              <p className="text-white/60 text-sm">Total Rides</p>
              <p className="text-white text-xl font-bold">{rides.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            
            <div>
              <p className="text-white/60 text-sm">Active Rides</p>
              <p className="text-white text-xl font-bold">
                {rides.filter(r => ['accepted', 'driver_arrived', 'in_progress'].includes(r.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            
            <div>
              <p className="text-white/60 text-sm">Total Revenue</p>
              <p className="text-white text-xl font-bold">
                Ksh {rides.reduce((total, ride) => total + (parseFloat(ride.fare) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            
            <div>
              <p className="text-white/60 text-sm">Avg. Fare</p>
              <p className="text-white text-xl font-bold">
                Ksh {rides.length > 0 ? Math.round(rides.reduce((total, ride) => total + (parseFloat(ride.fare) || 0), 0) / rides.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rides..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Status</option>
            <option value="requested" className="text-black">Requested</option>
            <option value="accepted" className="text-black">Accepted</option>
            <option value="driver_arrived" className="text-black">Driver Arrived</option>
            <option value="in_progress" className="text-black">In Progress</option>
            <option value="completed" className="text-black">Completed</option>
            <option value="cancelled" className="text-black">Cancelled</option>
          </select>

          <select
            value={filters.vehicle_type}
            onChange={(e) => setFilters(prev => ({ ...prev, vehicle_type: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Vehicles</option>
            <option value="economy" className="text-black">Economy</option>
    
            <option value="premium" className="text-black">Premium</option>
            
            <option value="boda" className="text-black">Boda</option>
          </select>

          <button
            onClick={fetchRides}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rides.map((ride) => (
          <div key={ride.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  {getVehicleIcon(ride.vehicle_type)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">Ride #{ride.id}</h3>
                    {getStatusBadge(ride.status)}
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                      {ride.vehicle_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ride.customer_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ride.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      
                      Ksh {ride.fare}
                    </div>
                  </div>
                </div>
              </div>

  <div className="relative">
  <button 
    onClick={() => handleViewDetails(ride)}
    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
  >
    
    <span className="text-sm">View Details</span>
  </button>
</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">{ride.pickup_address}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-sm">{ride.dropoff_address}</span>
                </div>
              </div>

              {ride.driver_name && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{ride.driver_name}</p>
                    <p className="text-white/60 text-xs">Driver</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {rides.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No rides found</p>
            <p className="text-white/40 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

{showDetailsModal && selectedRide && (
  (console.log('🔄 [RideManagement] Rendering RideDetailsModal:', { 
    showDetailsModal, 
    selectedRide: selectedRide.id,
    rideData: selectedRide 
  }),
  <RideDetailsModal 
    ride={selectedRide} 
    onClose={() => {
      console.log('❌ [RideManagement] Closing details modal');
      setShowDetailsModal(false);
      setSelectedRide(null);
    }} 
  />)
)}

{showChatModal && selectedRide && (
  (console.log('🔄 [RideManagement] Rendering ChatHistoryModal:', { 
    showChatModal, 
    selectedRide: selectedRide.id 
  }),
  <ChatHistoryModal 
    ride={selectedRide} 
    onClose={() => {
      console.log('❌ [RideManagement] Closing chat modal');
      setShowChatModal(false);
      setSelectedRide(null);
    }} 
  />)
)}

    </div>
  );
};

export default RideManagement;