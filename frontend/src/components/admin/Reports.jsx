import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, PieChart, Download, Filter, Calendar,
  DollarSign, Users, Car, Clock, MapPin, Eye, FileText,
  ArrowUp, ArrowDown, Search, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import AdminService from '../../services/adminService';
import RevenueChart from './RevenueChart';
import VehicleTypeChart from './VehicleTypeChart';

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
              {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span>{Math.abs(change)}% from last period</span>
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

const ChartContainer = ({ title, children, loading }) => {
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
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-emerald-400" />
        {title}
      </h3>
      
      {children}
    </div>
  );
};

const ReportTable = ({ title, data, columns, loading, onViewDetails }) => {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-24"></div>
                  <div className="h-2 bg-white/20 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/20 rounded w-20"></div>
                <div className="h-2 bg-white/20 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6 border-b border-white/20">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          {title}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {columns.map((column) => (
                <th key={column.key} className="text-left p-4 text-white/60 font-medium">
                  {column.label}
                </th>
              ))}
              <th className="text-left p-4 text-white/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data && data.map((item, index) => (
              <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="p-4">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                <td className="p-4">
                  <button
                    onClick={() => onViewDetails(item)}
                    className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!data || data.length === 0) && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No data available</p>
          <p className="text-white/40 text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

const RealTimeIndicator = ({ isRealTime, connectionStatus, lastUpdated, onToggleRealTime }) => (
  <div className="flex items-center gap-3">
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connectionStatus === 'connected' 
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30'
    }`}>
      {connectionStatus === 'connected' ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      {connectionStatus === 'connected' ? 'Live' : 'Disconnected'}
    </div>
    
    <div className="flex items-center gap-2 text-white/60 text-sm">
      <Clock className="w-4 h-4" />
      Updated: {lastUpdated.toLocaleTimeString()}
    </div>

    <button
      onClick={onToggleRealTime}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
        isRealTime
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-white/10 text-white/60 border-white/20 hover:text-white/80'
      }`}
    >
      {isRealTime ? 'Live' : 'Paused'}
    </button>
  </div>
);

const Reports = () => {
  const [activeReport, setActiveReport] = useState('earnings');
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const reportTypes = [
    { id: 'earnings', label: 'Earnings Report', icon: DollarSign, color: 'emerald' },
    { id: 'usage', label: 'Usage Analytics', icon: TrendingUp, color: 'blue' },
    
  ];

  const timeRanges = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const fetchEarningsReport = async () => {
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      const data = await AdminService.getEarningsReport(timeRange);
      setEarningsData(data);
      setConnectionStatus('connected');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch earnings report:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageReport = async () => {
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      const data = await AdminService.getUsageReport();
      setUsageData(data);
      setConnectionStatus('connected');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch usage report:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      if (activeReport === 'earnings') {
        fetchEarningsReport();
      } else if (activeReport === 'usage') {
        fetchUsageReport();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeReport, timeRange, isRealTime]);

  useEffect(() => {
    if (activeReport === 'earnings') {
      fetchEarningsReport();
    } else if (activeReport === 'usage') {
      fetchUsageReport();
    }
  }, [activeReport, timeRange]);

  const earningsStats = [
    {
      title: 'Total Revenue',
      value: `Ksh${(earningsData?.summary?.total_earnings || earningsData?.total_earnings || 0).toLocaleString()}`,
      change: 15.2,
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Total Rides',
      value: (earningsData?.summary?.total_rides || earningsData?.total_rides || 0).toLocaleString(),
      change: 8.3,
      icon: Car,
      color: 'blue'
    },
    {
      title: 'Average Fare',
      value: `Ksh${Math.round(earningsData?.summary?.average_fare || earningsData?.avg_fare || 0).toLocaleString()}`,
      change: 5.1,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Active Drivers',
      value: (usageData?.performance_metrics?.active_drivers || usageData?.active_drivers || 0).toLocaleString(),
      change: 3.7,
      icon: Users,
      color: 'amber'
    },
  ];

  const getTopDrivers = () => {
    if (earningsData?.top_drivers && earningsData.top_drivers.length > 0) {
      return earningsData.top_drivers.slice(0, 5).map(driver => ({
        id: driver.driver__id,
        driver_name: `${driver.driver__first_name || ''} ${driver.driver__last_name || ''}`.trim() || 'Unknown Driver',
        driver_email: driver.driver__email || 'No email',
        total_earnings: driver.total_earnings || 0,
        total_rides: driver.total_rides || 0,
        avg_rating: driver.avg_rating || 4.8
      }));
    }
    
    return [
      {
        id: 1,
        driver_name: 'John Kamau',
        driver_email: 'john@example.com',
        total_earnings: 125000,
        total_rides: 45,
        avg_rating: 4.8
      },
      {
        id: 2,
        driver_name: 'Mary Wanjiku',
        driver_email: 'mary@example.com',
        total_earnings: 118500,
        total_rides: 42,
        avg_rating: 4.9
      },
      {
        id: 3,
        driver_name: 'Peter Ochieng',
        driver_email: 'peter@example.com',
        total_earnings: 110200,
        total_rides: 38,
        avg_rating: 4.7
      },
    ];
  };

  const getVehicleTypes = () => {
    if (earningsData?.by_vehicle_type && earningsData.by_vehicle_type.length > 0) {
      return earningsData.by_vehicle_type.map(vehicle => ({
        vehicle_type: vehicle.vehicle_type || 'unknown',
        total_earnings: vehicle.total_earnings || 0,
        total_rides: vehicle.total_rides || 0,
        avg_fare: vehicle.avg_fare || 0
      }));
    }
    
    return [
      { vehicle_type: 'standard', total_earnings: 450000, total_rides: 1250, avg_fare: 360 },
      { vehicle_type: 'premium', total_earnings: 280000, total_rides: 560, avg_fare: 500 },
      { vehicle_type: 'boda', total_earnings: 320000, total_rides: 1800, avg_fare: 178 },
    ];
  };

  const getPopularRoutes = () => {
    if (usageData?.popular_routes && usageData.popular_routes.length > 0) {
      return usageData.popular_routes.slice(0, 5).map(route => ({
        pickup_address: route.pickup_address || 'Unknown Location',
        dropoff_address: route.dropoff_address || 'Unknown Destination',
        ride_count: route.ride_count || route.count || 0,
        avg_fare: route.avg_fare || 350
      }));
    }
    
    return [
      { pickup_address: 'Westlands', dropoff_address: 'CBD', ride_count: 234, avg_fare: 350 },
      { pickup_address: 'Kileleshwa', dropoff_address: 'Airport', ride_count: 189, avg_fare: 650 },
      { pickup_address: 'Karen', dropoff_address: 'CBD', ride_count: 167, avg_fare: 420 },
    ];
  };

  const topDriversColumns = [
    { 
      key: 'driver', 
      label: 'Driver', 
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">{item.driver_name}</p>
            <p className="text-white/60 text-sm">{item.driver_email}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'total_earnings', 
      label: 'Total Earnings', 
      render: (item) => (
        <span className="text-white font-medium">Ksh{item.total_earnings?.toLocaleString()}</span>
      )
    },
    { key: 'total_rides', label: 'Completed Rides' },
    
  ];

  const vehicleTypeColumns = [
    { 
      key: 'vehicle_type', 
      label: 'Vehicle Type', 
      render: (item) => (
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-400" />
          <span className="text-white capitalize">{item.vehicle_type}</span>
        </div>
      )
    },
    { 
      key: 'total_earnings', 
      label: 'Revenue', 
      render: (item) => (
        <span className="text-white font-medium">Ksh{item.total_earnings?.toLocaleString()}</span>
      )
    },
    { key: 'total_rides', label: 'Total Rides' },
    
  ];

  const popularRoutesColumns = [
    { 
      key: 'route', 
      label: 'Route', 
      render: (item) => (
        <div>
          <p className="text-white font-medium">{item.pickup_address}</p>
          <p className="text-white/60 text-sm">to {item.dropoff_address}</p>
        </div>
      )
    },
    { key: 'ride_count', label: 'Trips' },
    { 
      key: 'avg_fare', 
      label: 'Avg Fare', 
      render: (item) => (
        <span className="text-white/80">Ksh{Math.round(item.avg_fare || 0).toLocaleString()}</span>
      )
    },
  ];

  const renderEarningsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {earningsStats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Revenue Trend" loading={loading}>
          <RevenueChart data={earningsData} loading={loading} />
        </ChartContainer>

        <ChartContainer title="Earnings by Vehicle Type" loading={loading}>
          <VehicleTypeChart data={earningsData} loading={loading} />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportTable
          title="Top Performing Drivers"
          data={getTopDrivers()}
          columns={topDriversColumns}
          loading={loading}
          onViewDetails={(driver) => console.log('View driver:', driver)}
        />

        <ReportTable
          title="Revenue by Vehicle Type"
          data={getVehicleTypes()}
          columns={vehicleTypeColumns}
          loading={loading}
          onViewDetails={(vehicle) => console.log('View vehicle:', vehicle)}
        />
      </div>
    </div>
  );

  const renderUsageReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={(usageData?.user_metrics?.total_users || usageData?.total_users || 12487).toLocaleString()}
          change={12.5}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Ride Completion"
          value={`${Math.round(usageData?.ride_metrics?.completion_rate || usageData?.completion_rate || 85)}%`}
          change={3.2}
          icon={Car}
          color="emerald"
          loading={loading}
        />
        
        <StatCard
          title="Popular Routes"
          value={(usageData?.popular_routes?.length || 156).toLocaleString()}
          change={5.7}
          icon={MapPin}
          color="purple"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <ChartContainer title="User Growth" loading={loading}>
          <div className="h-64 flex items-center justify-center">
            {usageData?.user_metrics?.growth_data ? (
              <div className="text-center">
                <Users className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-medium">{usageData.user_metrics.growth_data.length} data points</p>
                <p className="text-white/60 text-sm">Real user growth data</p>
              </div>
            ) : (
              <div className="text-center">
                <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">User growth chart will be displayed here</p>
                <p className="text-white/40 text-sm">New user registrations over time</p>
              </div>
            )}
          </div>
        </ChartContainer> */}

        {/* <ChartContainer title="Ride Completion Rate" loading={loading}>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">Completion rate trends</p>
              <p className="text-white/40 text-sm">Weekly ride completion performance</p>
            </div>
          </div>
        </ChartContainer> */}
      </div>

      <ReportTable
        title="Most Popular Routes"
        data={getPopularRoutes()}
        columns={popularRoutesColumns}
        loading={loading}
        onViewDetails={(route) => console.log('View route:', route)}
      />
    </div>
  );

  

  

  const renderReportContent = () => {
    switch (activeReport) {
      case 'earnings':
        return renderEarningsReport();
      case 'usage':
        return renderUsageReport();
      default:
        return renderEarningsReport();
    }
  };

  const handleRefresh = () => {
    if (activeReport === 'earnings') {
      fetchEarningsReport();
    } else if (activeReport === 'usage') {
      fetchUsageReport();
    }
  };

  const handleToggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
            <RealTimeIndicator 
              isRealTime={isRealTime}
              connectionStatus={connectionStatus}
              lastUpdated={lastUpdated}
              onToggleRealTime={handleToggleRealTime}
            />
          </div>
          <p className="text-white/60">
            {isRealTime ? 'Live platform analytics and insights' : 'Static report data'}
            {loading && ' • Loading...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                activeReport === report.id
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5 border-white/20'
              }`}
            >
              <report.icon className="w-5 h-5" />
              <span className="font-medium">{report.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Report Period</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white/5 border border-white/20 rounded-xl p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range.value
                      ? 'bg-emerald-500 text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="text-white/60">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {renderReportContent()}
    </div>
  );
};

export default Reports;