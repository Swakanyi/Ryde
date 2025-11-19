import React, { useState, useEffect } from 'react';
import { 
  Users, Car, DollarSign, BarChart3, Shield, Bell, Settings,
  Clock, TrendingUp, AlertTriangle, UserCheck, X, LogOut, Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AdminService from '../../services/adminService';
import DashboardView from './DashboardView';
import UserManagement from './UserManagement';
import RideManagement from './RideManagement';
import DriverManagement from './DriverManagement';
import EmergencyManagement from './EmergencyManagement';
import Reports from './Reports';
import Notifications from './Notifications';
import SystemSettings from './SystemSettings';
import AuthService from '../../services/auth';


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
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Admin Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
                    !notification.is_read ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {notification.type === 'new_driver' && (
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                      )}
                      {notification.type === 'new_emergency' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      {notification.type === 'system_alert' && (
                        <Shield className="w-4 h-4 text-blue-500" />
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
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      setError(err.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await AdminService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.summary?.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await AdminService.markAllNotificationsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const clearNotification = (notificationId) => {
    const removedNotif = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (removedNotif && !removedNotif.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'rides', label: 'Rides', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: UserCheck },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
      
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
             
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              
              <Link to='/homepage'>
                <span className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                  Ryde Admin
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
              />

              <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 border border-white/20">
                <Users className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">
                  Administrator
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      
      <div className="flex w-full">
        
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
       
        <div className={`
          fixed lg:sticky top-20 left-0 z-40 h-[calc(100vh-80px)]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative
          w-64 bg-white/10 backdrop-blur-xl border-r border-white/20
        `}>
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
          {activeTab === 'dashboard' && <DashboardView data={dashboardData} />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'rides' && <RideManagement />}
          {activeTab === 'drivers' && <DriverManagement />}
          {activeTab === 'emergency' && <EmergencyManagement />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'settings' && <SystemSettings />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;