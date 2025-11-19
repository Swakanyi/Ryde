import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, Filter, Car, Shield, Clock, 
  CheckCircle, XCircle, MoreVertical, MapPin, Star,
  Mail, Phone, Calendar, AlertTriangle, Eye, FileText, Download
} from 'lucide-react';
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
    approval_status: ''
  });

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
            All Drivers ({drivers.length})
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
              {drivers.map((driver) => (
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

                    <div className="flex items-center gap-2">
                      <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
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

              {drivers.length === 0 && (
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