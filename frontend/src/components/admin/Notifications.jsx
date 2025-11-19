import React, { useState, useEffect } from 'react';
import { 
  Bell, Filter, Search, X, Check, Trash2, 
  AlertTriangle, UserCheck, Shield, Car, DollarSign,
  Calendar, Clock, User, Settings
} from 'lucide-react';
import AdminService from '../../services/adminService';

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      new_driver: UserCheck,
      new_emergency: AlertTriangle,
      system_alert: Shield,
      ride_issue: Car,
      payment_issue: DollarSign,
      driver_suspended: User
    };
    const Icon = icons[type] || Bell;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-blue-400',
      medium: 'text-emerald-400',
      high: 'text-amber-400',
      critical: 'text-red-400'
    };
    return colors[priority] || 'text-white/60';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
      !notification.is_read ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' : ''
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            !notification.is_read ? 'bg-emerald-500/20' : 'bg-white/10'
          }`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-white font-semibold text-sm">
                {notification.title}
              </h4>
              <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </span>
            </div>
            <p className="text-white/70 text-sm mb-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {getTimeAgo(notification.created_at)}
              </div>
              {notification.related_user && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {notification.related_user.name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          {!notification.is_read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="p-1 text-white/40 hover:text-red-400 transition-colors"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    is_read: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    page_size: 20
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getNotifications(filters);
      setNotifications(data.notifications || []);
      setFilteredNotifications(data.notifications || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await AdminService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await AdminService.markAllNotificationsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (filterParams) => {
    let filtered = notifications;

    if (filterParams.type) {
      filtered = filtered.filter(notif => notif.type === filterParams.type);
    }

    if (filterParams.priority) {
      filtered = filtered.filter(notif => notif.priority === filterParams.priority);
    }

    if (filterParams.is_read !== '') {
      filtered = filtered.filter(notif => notif.is_read === (filterParams.is_read === 'true'));
    }

    if (filterParams.search) {
      const searchLower = filterParams.search.toLowerCase();
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNotifications(filtered);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const notificationTypes = [
    { value: 'new_driver', label: 'New Drivers', icon: UserCheck },
    { value: 'new_emergency', label: 'Emergencies', icon: AlertTriangle },
    { value: 'system_alert', label: 'System Alerts', icon: Shield },
    { value: 'ride_issue', label: 'Ride Issues', icon: Car },
    { value: 'payment_issue', label: 'Payment Issues', icon: DollarSign }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-blue-400' },
    { value: 'medium', label: 'Medium', color: 'text-emerald-400' },
    { value: 'high', label: 'High', color: 'text-amber-400' },
    { value: 'critical', label: 'Critical', color: 'text-red-400' }
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const highPriorityCount = notifications.filter(n => 
    !n.is_read && ['high', 'critical'].includes(n.priority)
  ).length;

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/60">Manage system alerts and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

     
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">{notifications.length}</p>
              <p className="text-white/60 text-sm">Total Notifications</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-white">{unreadCount}</p>
              <p className="text-white/60 text-sm">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{highPriorityCount}</p>
              <p className="text-white/60 text-sm">High Priority</p>
            </div>
          </div>
        </div>
      </div>

     
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
            />
          </div>

          
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Types</option>
            {notificationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Priorities</option>
            {priorityLevels.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          
          <select
            value={filters.is_read}
            onChange={(e) => handleFilterChange('is_read', e.target.value)}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        {loading ? (
          
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-white/10 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/20 rounded w-1/3"></div>
                  <div className="h-3 bg-white/20 rounded w-2/3"></div>
                  <div className="h-2 bg-white/20 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No notifications found</p>
            <p className="text-white/40 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
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
    </div>
  );
};

export default Notifications;