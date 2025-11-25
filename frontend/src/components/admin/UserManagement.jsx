import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, MoreVertical, Edit, Trash2, Eye,
  UserCheck, UserX, Shield, Mail, Phone, Calendar
} from 'lucide-react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import AdminService from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [filters, setFilters] = useState({
    user_type: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    page_size: 20
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getUsers(filters);
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (user) => {
    if (user.user_type === 'driver' || user.user_type === 'boda_rider') {
      const status = user.approval_status;
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
    }
    
    const isActive = 
      user.is_active === true || 
      user.status === 'active' || 
      user.last_login || 
      user.is_active === undefined; 
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${
        isActive 
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setActionType('view');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setActionType('edit');
    setShowUserModal(true);
  };

  const handleApproveDriver = async (user) => {
    if (window.confirm(`Approve ${user.first_name} as a driver?`)) {
      try {
        await AdminService.approveDriver(user.id);
        fetchUsers();
      } catch (error) {
        setError('Failed to approve driver');
      }
    }
  };

  const handleRejectDriver = async (user) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await AdminService.rejectDriver(user.id, { reason });
        fetchUsers();
      } catch (error) {
        setError('Failed to reject driver');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
      try {
        console.log('🟡 [Frontend] Starting delete for user ID:', user.id);
        await AdminService.deleteUser(user.id);
        setError('');
        await fetchUsers();
        console.log('✅ [Frontend] User list refreshed after delete');
      } catch (error) {
        console.error('❌ [Frontend] Delete failed:', error);
        setError(error.message || 'Failed to delete user');
      }
    }
  };

  const handleSuspendUser = async (user) => {
    if (window.confirm(`Are you sure you want to suspend ${user.first_name}?`)) {
      try {
        await AdminService.suspendDriver(user.id);
        fetchUsers();
      } catch (error) {
        setError('Failed to suspend user');
      }
    }
  };

  const handleActivateUser = async (user) => {
    if (window.confirm(`Are you sure you want to activate ${user.first_name}?`)) {
      try {
        await AdminService.updateUser(user.id, { is_active: true });
        fetchUsers();
      } catch (error) {
        setError('Failed to activate user');
      }
    }
  };

  const UserDetailsView = ({ user }) => {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">BASIC INFORMATION</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">First Name</label>
              <p className="text-gray-800 font-medium">{user.first_name}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last Name</label>
              <p className="text-gray-800 font-medium">{user.last_name}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <p className="text-gray-800 font-medium">{user.phone_number || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">ACCOUNT INFORMATION</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">User Type</label>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                {user.user_type?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              {getStatusBadge(user)}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Joined Date</label>
              <p className="text-gray-800 font-medium">
                {new Date(user.created_at).toLocaleDateString()} at {new Date(user.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last Login</label>
              <p className="text-gray-800 font-medium">
                {user.last_login 
                  ? `${new Date(user.last_login).toLocaleDateString()} at ${new Date(user.last_login).toLocaleTimeString()}`
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {(user.user_type === 'driver' || user.user_type === 'boda_rider') && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">DRIVER INFORMATION</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Approval Status</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  user.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                  user.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  user.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.approval_status || 'N/A'}
                </span>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">License Number</label>
                <p className="text-gray-800 font-medium">{user.license_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vehicle Type</label>
                <p className="text-gray-800 font-medium">{user.vehicle_type || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vehicle Plate</label>
                <p className="text-gray-800 font-medium">{user.vehicle_plate || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">ACTIVITY STATISTICS</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{user.total_rides || 0}</p>
              <p className="text-xs text-gray-600">Total Rides</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{user.completed_rides || 0}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{user.cancelled_rides || 0}</p>
              <p className="text-xs text-gray-600">Cancelled</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{user.rating || 'N/A'}</p>
              <p className="text-xs text-gray-600">Rating</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => setActionType('edit')}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Edit User
          </button>
          <button
            onClick={() => setShowUserModal(false)}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const UserEditForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      is_active: user.is_active !== undefined ? user.is_active : true,
      ...(user.user_type === 'driver' || user.user_type === 'boda_rider' ? {
        approval_status: user.approval_status || 'pending',
        license_number: user.license_number || '',
        vehicle_type: user.vehicle_type || '',
        vehicle_plate: user.vehicle_plate || ''
      } : {})
    });

    const handleSubmit = (e) => {
      e.preventDefault(); 
      onSave(user.id, formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">BASIC INFORMATION</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">ACCOUNT STATUS</h4>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Active Account</span>
            </label>
          </div>
        </div>

        {(user.user_type === 'driver' || user.user_type === 'boda_rider') && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">DRIVER INFORMATION</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Approval Status</label>
                <select
                  value={formData.approval_status}
                  onChange={(e) => handleChange('approval_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => handleChange('license_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Vehicle Type</label>
                <input
                  type="text"
                  value={formData.vehicle_type}
                  onChange={(e) => handleChange('vehicle_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Vehicle Plate</label>
                <input
                  type="text"
                  value={formData.vehicle_plate}
                  onChange={(e) => handleChange('vehicle_plate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const handleSaveUser = async (userId, formData) => {
    try {
      await AdminService.updateUser(userId, formData);
      setShowUserModal(false);
      setSelectedUser(null);
      fetchUsers(); 
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const getUserIcon = (userType) => {
    const icons = {
      customer: Users,
      driver: UserCheck,
      boda_rider: UserCheck,
      emergency_responder: Shield
    };
    const Icon = icons[userType] || Users;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) return <div className="text-white p-4">Loading users...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/60">Manage all system users and their permissions</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <select
            value={filters.user_type}
            onChange={(e) => handleFilterChange('user_type', e.target.value)}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Types</option>
            <option value="customer" className="text-black">Customers</option>
            <option value="driver" className="text-black">Drivers</option>
            <option value="boda_rider" className="text-black">Boda Riders</option>
            <option value="emergency_responder" className="text-black">Emergency Responders</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Status</option>
            <option value="pending" className="text-black">Pending Approval</option>
          </select>

          <button
            onClick={fetchUsers}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-4 text-white/60 font-medium">User</th>
                <th className="text-left p-4 text-white/60 font-medium">Type</th>
                <th className="text-left p-4 text-white/60 font-medium">Status</th>
                <th className="text-left p-4 text-white/60 font-medium">Contact</th>
                <th className="text-left p-4 text-white/60 font-medium">Joined</th>
                <th className="text-left p-4 text-white/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                        {getUserIcon(user.user_type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-white/60 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getUserIcon(user.user_type)}
                      <span className="text-white capitalize">
                        {user.user_type?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(user)}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      {user.phone_number && (
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                          <Phone className="w-3 h-3" />
                          {user.phone_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <Menu as="div" className="relative">
                      <MenuButton className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </MenuButton>
                      <MenuItems 
                        anchor="bottom end"
                        className="w-48 bg-gray-800 border border-white/20 rounded-xl shadow-lg z-50 origin-top-right transition duration-100 ease-out [--anchor-gap:4px] focus:outline-none"
                      >
                        
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleViewUser(user)}
                              className={`${
                                focus ? 'bg-white/10' : ''
                              } w-full px-4 py-2 text-left text-white flex items-center gap-3 rounded-t-xl`}
                            >
                              
                              View Details
                            </button>
                          )}
                        </MenuItem>

                        
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleEditUser(user)}
                              className={`${
                                focus ? 'bg-white/10' : ''
                              } w-full px-4 py-2 text-left text-white flex items-center gap-3`}
                            >
                              
                              Edit User
                            </button>
                          )}
                        </MenuItem>

                        
                        {(user.user_type === 'driver' || user.user_type === 'boda_rider') && (
                          <>
                            {user.approval_status === 'pending' && (
                              <>
                                <MenuItem>
                                  {({ focus }) => (
                                    <button
                                      onClick={() => handleApproveDriver(user)}
                                      className={`${
                                        focus ? 'bg-emerald-500/10' : ''
                                      } w-full px-4 py-2 text-left text-emerald-400 flex items-center gap-3`}
                                    >
                                      
                                      Approve Driver
                                    </button>
                                  )}
                                </MenuItem>
                                <MenuItem>
                                  {({ focus }) => (
                                    <button
                                      onClick={() => handleRejectDriver(user)}
                                      className={`${
                                        focus ? 'bg-red-500/10' : ''
                                      } w-full px-4 py-2 text-left text-red-400 flex items-center gap-3`}
                                    >
                                      
                                      Reject Driver
                                    </button>
                                  )}
                                </MenuItem>
                              </>
                            )}
                            {user.approval_status === 'approved' && (
                              <MenuItem>
                                {({ focus }) => (
                                  <button
                                    onClick={() => handleSuspendUser(user)}
                                    className={`${
                                      focus ? 'bg-yellow-500/10' : ''
                                    } w-full px-4 py-2 text-left text-yellow-400 flex items-center gap-3`}
                                  >
                                    
                                    Suspend User
                                  </button>
                                )}
                              </MenuItem>
                            )}
                          </>
                        )}

                        
                        {!['driver', 'boda_rider'].includes(user.user_type) && (
                          <MenuItem>
                            {({ focus }) => (
                              <button
                                onClick={() => 
                                  user.is_active ? handleSuspendUser(user) : handleActivateUser(user)
                                }
                                className={`${
                                  focus ? 'bg-yellow-500/10' : ''
                                } w-full px-4 py-2 text-left text-yellow-400 flex items-center gap-3`}
                              >
                                
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </MenuItem>
                        )}

                       
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className={`${
                                focus ? 'bg-red-500/10' : ''
                              } w-full px-4 py-2 text-left text-red-400 flex items-center gap-3 rounded-b-xl`}
                            >
                              
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No users found</p>
            <p className="text-white/40 text-sm">Try adjusting your filters</p>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="p-4 border-t border-white/20 flex justify-between items-center">
            <p className="text-white/60 text-sm">
              Showing page {pagination.current_page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.current_page === 1}
                className="px-3 py-1 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page === pagination.total_pages}
                className="px-3 py-1 rounded-lg bg-white/5 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                    {getUserIcon(selectedUser.user_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {actionType === 'view' ? 'User Details' : 'Edit User'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {actionType === 'view' ? (
                <UserDetailsView user={selectedUser} />
              ) : (
                <UserEditForm 
                  user={selectedUser} 
                  onSave={handleSaveUser}
                  onCancel={() => setShowUserModal(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;