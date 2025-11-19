import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Filter, Clock, MapPin, User,
  Ambulance, Truck, Shield, Flame, MoreVertical,
  CheckCircle, XCircle, Phone, Calendar
} from 'lucide-react';
import AdminService from '../../services/adminService';

const EmergencyManagement = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    service_type: '',
    search: ''
  });

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getEmergencyRequests(filters);
      setEmergencies(data.requests || []);
    } catch (err) {
      setError(err.error || 'Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, [filters]);

  const getServiceIcon = (serviceType) => {
    const icons = {
      ambulance: Ambulance,
      tow_truck: Truck,
      police: Shield,
      fire: Flame
    };
    const Icon = icons[serviceType] || AlertTriangle;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Requested' },
      accepted: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Accepted' },
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

  const getServiceTypeBadge = (serviceType) => {
    const colors = {
      ambulance: 'bg-red-500/20 text-red-300 border-red-500/30',
      tow_truck: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      police: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      fire: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[serviceType] || colors.ambulance} capitalize`}>
        {serviceType.replace('_', ' ')}
      </span>
    );
  };

  if (loading) return <div className="text-white p-4">Loading emergencies...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Management</h1>
          <p className="text-white/60">Monitor and manage emergency service requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Requests</p>
              <p className="text-white text-xl font-bold">{emergencies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Active</p>
              <p className="text-white text-xl font-bold">
                {emergencies.filter(e => ['requested', 'accepted', 'in_progress'].includes(e.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Ambulance className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Ambulance</p>
              <p className="text-white text-xl font-bold">
                {emergencies.filter(e => e.service_type === 'ambulance').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Police</p>
              <p className="text-white text-xl font-bold">
                {emergencies.filter(e => e.service_type === 'police').length}
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
              placeholder="Search emergencies..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Status</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.service_type}
            onChange={(e) => setFilters(prev => ({ ...prev, service_type: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Services</option>
            <option value="ambulance">Ambulance</option>
            <option value="tow_truck">Tow Truck</option>
            <option value="police">Police</option>
            <option value="fire">Fire Department</option>
          </select>

          <button
            onClick={fetchEmergencies}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      
      <div className="space-y-4">
        {emergencies.map((emergency) => (
          <div key={emergency.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  {getServiceIcon(emergency.service_type)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">Emergency #{emergency.id}</h3>
                    {getStatusBadge(emergency.status)}
                    {getServiceTypeBadge(emergency.service_type)}
                  </div>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {emergency.customer?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {emergency.customer?.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(emergency.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Location & Description</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-white/80">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{emergency.location?.address}</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/80">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{emergency.description}</span>
                  </div>
                </div>
              </div>

              {emergency.accepted_by && (
                <div>
                  <h4 className="text-white font-medium mb-2">Assigned Responder</h4>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm">{emergency.accepted_by.name}</p>
                      <p className="text-white/60 text-xs">Emergency Responder</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {emergency.status === 'requested' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Assign Responder
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Cancel Request
                </button>
              </div>
            )}
          </div>
        ))}

        {emergencies.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No emergency requests found</p>
            <p className="text-white/40 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyManagement;