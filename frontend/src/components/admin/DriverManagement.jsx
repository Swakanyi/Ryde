import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, Filter, Car, Shield, Clock, 
  CheckCircle, XCircle, MoreVertical, MapPin, Star,
  Mail, Phone, Calendar, AlertTriangle, Eye, FileText, Download,
  Edit, X
} from 'lucide-react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import AdminService from '../../services/adminService';
import Documents from './Documents'; 

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    approval_status: '',
    vehicle_type: '',
    date_range: '',
    has_documents: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getUsers({ user_type: 'driver' });
      setDrivers(data.users || []);
    } catch (err) {
      setError(err.error || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const data = await AdminService.getPendingDriversWithDocuments();
      setPendingDrivers(data || []);
    } catch (err) {
      console.error('Failed to load pending drivers:', err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPendingDrivers();
  }, []);

 
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = !filters.search || 
      driver.first_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      driver.last_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      driver.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      driver.phone_number?.includes(filters.search);

    const matchesStatus = !filters.approval_status || 
      driver.approval_status === filters.approval_status;

    const matchesVehicle = !filters.vehicle_type || 
      getVehicleType(driver).toLowerCase() === filters.vehicle_type.toLowerCase();

    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setShowEditModal(true);
  };

  const handleUpdateDriver = async (driverId, updateData) => {
    try {
      await AdminService.updateUser(driverId, updateData);
      fetchDrivers();
      setShowEditModal(false);
      setEditingDriver(null);
    } catch (err) {
      setError(err.error || 'Failed to update driver');
    }
  };

  const handleSuspendDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to suspend this driver?')) return;
    try {
      await AdminService.suspendDriver(driverId);
      fetchDrivers();
    } catch (err) {
      setError(err.error || 'Failed to suspend driver');
    }
  };

  const handleViewDocuments = (driver) => {
    setSelectedDriver(driver);
    setShowDocumentModal(true);
  };

  const handleApproveDriver = async (driverId, action) => {
    try {
      await AdminService.approveDriver(driverId, { 
        action: action === 'approve' ? 'approve' : 'reject',
        reason: action === 'approve' ? 'Approved by admin' : 'Rejected by admin'
      });
      fetchPendingDrivers();
      fetchDrivers();
    } catch (err) {
      setError(err.error || `Failed to ${action} driver`);
    }
  };

  const handleDocumentModalClose = () => {
    setShowDocumentModal(false);
    setSelectedDriver(null);
  };

  const handleDocumentModalApprove = () => {
    fetchPendingDrivers();
    fetchDrivers();
  };

  const getStatusBadge = (driver) => {
    const status = driver.approval_status;
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      suspended: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

const EditDriverModal = ({ driver, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: driver?.first_name || '',
    last_name: driver?.last_name || '',
    email: driver?.email || '',
    phone_number: driver?.phone_number || '',
    driver_license: driver?.driver_license || '',
    approval_status: driver?.approval_status || 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onUpdate(driver.id, formData);
    } catch (err) {
      setError(err.error || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-xl font-bold">Edit Driver</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Driver License</label>
            <input
              type="text"
              name="driver_license"
              value={formData.driver_license}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Status</label>
            <select
              name="approval_status"
              value={formData.approval_status}
              onChange={handleChange}
              className="w-full bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  const getVehicleType = (driver) => {
    if (driver.user_type === 'boda_rider') return 'Boda';
    return driver.vehicle?.vehicle_type || 'N/A';
  };

  if (loading) return <div className="text-white p-4">Loading drivers...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Management</h1>
          <p className="text-white/60">Manage driver registrations and approvals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 text-sm">Total Drivers</p>
              <p className="text-white text-xl font-bold">{drivers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 text-sm">Pending Approval</p>
              <p className="text-white text-xl font-bold">{pendingDrivers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 text-sm">Approved</p>
              <p className="text-white text-xl font-bold">
                {drivers.filter(d => d.approval_status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 text-sm">Suspended</p>
              <p className="text-white text-xl font-bold">
                {drivers.filter(d => d.approval_status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>
          
          <select
            value={filters.approval_status}
            onChange={(e) => setFilters(prev => ({ ...prev, approval_status: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="" className="text-black">All Status</option>
            <option value="pending" className="text-black">Pending</option>
            <option value="approved" className="text-black">Approved</option>
            <option value="rejected" className="text-black">Rejected</option>
            <option value="suspended"className="text-black">Suspended</option>
          </select>

          <select
            value={filters.vehicle_type}
            onChange={(e) => setFilters(prev => ({ ...prev, vehicle_type: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="" className="text-black">All Vehicles</option>
            <option value="car" className="text-black">Car</option>
            <option value="boda" className="text-black">Boda</option>
            <option value="tuk-tuk" className="text-black">Tuk-tuk</option>
          </select>

          <select
            value={filters.has_documents}
            onChange={(e) => setFilters(prev => ({ ...prev, has_documents: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="" className="text-black">All Documents</option>
            <option value="complete" className="text-black">Complete</option>
            <option value="incomplete" className="text-black">Incomplete</option>
          </select>

          <button
            onClick={fetchDrivers}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
        <div className="flex border-b border-white/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            All Drivers ({filteredDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Pending Approval ({pendingDrivers.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingDrivers.map((driver) => (
                <div key={driver.id} className="bg-white/5 rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {driver.first_name} {driver.last_name}
                        </h3>
                        <p className="text-white/60 text-sm">{driver.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            Pending Approval
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                            {driver.user_type}
                          </span>
                          {driver.has_all_documents ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              All Documents
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                              Missing Documents
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDocuments(driver)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Documents
                      </button>
                      <button
                        onClick={() => handleApproveDriver(driver.id, 'approve')}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveDriver(driver.id, 'reject')}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium mb-2">Document Status</h4>
                      <div className="space-y-2 text-sm">
                        {driver.documents_status && Object.entries(driver.documents_status).map(([doc, hasDoc]) => (
                          <div key={doc} className="flex items-center justify-between">
                            <span className="text-white/60 capitalize">{doc.replace('_', ' ')}:</span>
                            {hasDoc ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Driver Information</h4>
                      <div className="space-y-2 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          License: {driver.driver_license}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {driver.phone_number}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Application Date</h4>
                      <div className="text-white/80 text-sm">
                        {new Date(driver.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {pendingDrivers.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">No pending driver applications</p>
                  <p className="text-white/40 text-sm">All driver applications have been processed</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {driver.first_name} {driver.last_name}
                        </h3>
                        <p className="text-white/60 text-sm">{driver.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(driver)}
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                            {getVehicleType(driver)}
                          </span>
                          {driver.ride_stats && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {driver.ride_stats.total_rides_as_driver} rides
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Menu as="div" className="relative">
                      <MenuButton className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis-vertical w-4 h-4">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="12" cy="5" r="1"></circle>
                          <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                      </MenuButton>
                      <MenuItems 
                        anchor="bottom end"
                        className="w-48 bg-gray-800 border border-white/20 rounded-xl shadow-lg z-50 origin-top-right transition duration-100 ease-out [--anchor-gap:4px] focus:outline-none"
                      >
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleEditDriver(driver)}
                              className={`${
                                focus ? 'bg-white/10' : ''
                              } w-full px-4 py-2 text-left text-white flex items-center gap-3 rounded-t-xl`}
                            >
                              <Edit className="w-4 h-4" />
                              Edit Driver
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleViewDocuments(driver)}
                              className={`${
                                focus ? 'bg-white/10' : ''
                              } w-full px-4 py-2 text-left text-white flex items-center gap-3`}
                            >
                              <FileText className="w-4 h-4" />
                              View Documents
                            </button>
                          )}
                        </MenuItem>
                        {driver.approval_status === 'approved' && (
                          <MenuItem>
                            {({ focus }) => (
                              <button
                                onClick={() => handleSuspendDriver(driver.id)}
                                className={`${
                                  focus ? 'bg-yellow-500/10' : ''
                                } w-full px-4 py-2 text-left text-yellow-400 flex items-center gap-3`}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Suspend Driver
                              </button>
                            )}
                          </MenuItem>
                        )}
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`${
                                focus ? 'bg-white/10' : ''
                              } w-full px-4 py-2 text-left text-white flex items-center gap-3 rounded-b-xl`}
                            >
                              <Clock className="w-4 h-4" />
                              Ride History
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {driver.phone_number || 'No phone'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      {driver.driver_license || 'No license'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(driver.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}

              {filteredDrivers.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">No drivers found</p>
                  <p className="text-white/40 text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && editingDriver && (
  <EditDriverModal 
    driver={editingDriver}
    onClose={() => {
      setShowEditModal(false);
      setEditingDriver(null);

    }}
    onUpdate={handleUpdateDriver}
  />
)}

      {showDocumentModal && (
        <Documents
          driver={selectedDriver}
          onClose={handleDocumentModalClose}
          onApprove={handleDocumentModalApprove}
        />
      )}
    </div>
  );
};

export default DriverManagement;