import React, { useState, useEffect } from 'react';
import { 
  Users, Car, DollarSign, TrendingUp, 
  AlertTriangle, UserCheck, Clock, Shield,
  BarChart3, MapPin, Calendar, User
} from 'lucide-react';
import AdminService from '../../services/adminService';

const StatCard = ({ title, value, change, icon: Icon, color = 'emerald', loading }) => {
  const colors = {
    emerald: 'from-emerald-500 to-green-500',
    blue: 'from-blue-500 to-cyan-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500'
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
            <div className="h-8 bg-white/20 rounded w-3/4"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:transform hover:scale-105 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/60 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${
              change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-white/60'
            }`}>
              <TrendingUp className={`w-4 h-4 ${change < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(change)}% from last week</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const QuickAction = ({ title, description, icon: Icon, action, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
  };

  return (
    <button
      onClick={action}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:transform hover:scale-105 ${colors[color]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </button>
  );
};

const ChartPlaceholder = ({ title, description, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-white/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-emerald-400" />
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="h-48 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60">{description}</p>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ data }) => {
  const [dashboardData, setDashboardData] = useState(data);
  const [loading, setLoading] = useState(!data);
  const [timeRange, setTimeRange] = useState('week');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      fetchDashboardData();
    }
  }, []);

  const stats = dashboardData?.overview || {};
  const userStats = dashboardData?.users || {};
  const rideStats = dashboardData?.rides || {};
  const revenueStats = dashboardData?.revenue || {};
  const driverStats = dashboardData?.drivers || {};

  const quickActions = [
    {
      title: 'Review Pending Drivers',
      description: `${driverStats.pending_approval || 0} drivers awaiting approval`,
      icon: UserCheck,
      action: () => window.location.hash = '#drivers',
      color: 'amber'
    },
    {
      title: 'View Active Emergencies',
      description: `${dashboardData?.emergency_services?.active_requests || 0} active requests`,
      icon: AlertTriangle,
      action: () => window.location.hash = '#emergency',
      color: 'red'
    },
    {
      title: 'System Health',
      description: 'Monitor platform performance',
      icon: Shield,
      action: () => window.location.hash = '#settings',
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/60">Real-time overview of your platform</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1 border border-white/20">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-emerald-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={userStats.total?.toLocaleString() || '0'}
          
          loading={loading}
        />
        <StatCard
          title="Total Rides"
          value={rideStats.total?.toLocaleString() || '0'}
          
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={`Ksh${(revenueStats.total || 0).toLocaleString()}`}
          
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={userStats.customers?.toLocaleString() || '0'}
          
          loading={loading}
        />
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Drivers"
          value={driverStats.pending_approval?.toLocaleString() || '0'}
          
          loading={loading}
        />
        <StatCard
          title="Approved Drivers"
          value={driverStats.approved?.toLocaleString() || '0'}
          
          loading={loading}
        />
        <StatCard
          title="Completion Rate"
          value={`${Math.round(rideStats.completion_rate || 0)}%`}
          
          loading={loading}
        />
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <ChartPlaceholder
            title="Revenue Overview"
            description="Revenue analytics will be displayed here"
            loading={loading}
          />
        </div>

        
        <div className="space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Quick Actions
          </h3>
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      
      
    </div>
  );
};

export default DashboardView;