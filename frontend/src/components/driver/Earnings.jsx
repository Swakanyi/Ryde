import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import DriverService from '../../services/driverApi';

const Earnings = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchEarningsData();
  }, [period]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const data = await DriverService.getEarnings(period);
      setEarningsData(data);
    } catch (error) {
      setError(error.error || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Earnings</h2>
          <p className="text-white/60">Track your earnings and performance</p>
        </div>
        
      
        <div className="flex bg-white/10 rounded-xl p-1 border border-white/20">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-emerald-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {earningsData && (
        <>
         
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Earnings</p>
                  <p className="text-white text-2xl font-bold">
                    Ksh {earningsData.total_earnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Rides</p>
                  <p className="text-white text-2xl font-bold">
                    {earningsData.total_rides}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Avg per Ride</p>
                  <p className="text-white text-2xl font-bold">
                    Ksh {Math.round(earningsData.average_earnings_per_ride).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

         
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Calendar className="w-4 h-4" />
              Showing earnings from {new Date(earningsData.start_date).toLocaleDateString()} to {new Date(earningsData.end_date).toLocaleDateString()}
            </div>
          </div>

          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Rides</h3>
              <button className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="space-y-4">
              {earningsData.rides.slice(0, 5).map((ride) => (
                <div key={ride.id} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-white font-medium">{ride.customer_name}</p>
                    <p className="text-white/60 text-sm">
                      {ride.pickup_address} → {ride.dropoff_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">Ksh {ride.fare}</p>
                    <p className="text-white/60 text-sm">
                      {new Date(ride.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {earningsData.rides.length > 5 && (
              <div className="text-center pt-4">
                <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                  View All {earningsData.total_rides} Rides
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Earnings;