import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <span className="text-gray-300">Revenue:</span>
          </div>
          <span className="text-white font-semibold text-lg">
            Ksh{payload[0].value?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data, loading }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    console.log('📊 RevenueChart processing data:', data);
    
    let transformedData = [];
    
    if (data?.daily_breakdown) {
      transformedData = data.daily_breakdown.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.total_earnings || day.revenue || 0
      }));
    } else if (data?.daily_earnings) {
      transformedData = data.daily_earnings.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.earnings || day.revenue || 0
      }));
    } else {
      transformedData = [
        { date: 'Jan 1', revenue: 45000 },
        { date: 'Jan 2', revenue: 52000 },
        { date: 'Jan 3', revenue: 48000 },
        { date: 'Jan 4', revenue: 61000 },
        { date: 'Jan 5', revenue: 55000 },
        { date: 'Jan 6', revenue: 72000 },
        { date: 'Jan 7', revenue: 68000 },
      ];
    }
    
    console.log('📈 Final chart data:', transformedData);
    setChartData(transformedData);
  }, [data]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/60">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-white/60 text-lg mb-1">No Revenue Data</p>
        <p className="text-white/40 text-sm">Revenue data will appear here when available</p>
      </div>
    );
  }

 
  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
  const averageDailyRevenue = totalRevenue / chartData.length;
  const highestRevenue = Math.max(...chartData.map(day => day.revenue));
  const lowestRevenue = Math.min(...chartData.map(day => day.revenue));

  return (
    <div className="w-full">
     
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Revenue Trends</h3>
          <p className="text-white/60 text-sm">Daily revenue performance</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="text-right">
            <p className="text-white/60 text-sm">Total Revenue</p>
            <p className="text-white font-semibold">Ksh{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Daily Average</p>
            <p className="text-white font-semibold">Ksh{Math.round(averageDailyRevenue).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Peak Day</p>
            <p className="text-white font-semibold">Ksh{highestRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#4B5563' }}
              tickMargin={10}
            />
            
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#4B5563' }}
              tickFormatter={(value) => `Ksh${(value / 1000).toFixed(0)}k`}
              width={60}
              tickMargin={10}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revenueGradient)"
              fillOpacity={1}
            />
           
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ 
                fill: '#10B981', 
                strokeWidth: 2, 
                r: 4,
                stroke: '#FFFFFF'
              }}
              activeDot={{ 
                r: 6, 
                fill: '#059669',
                stroke: '#FFFFFF',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className="w-3 h-0.5 bg-emerald-400"></div>
          <span>Daily Revenue</span>
        </div>
        <p className="text-white/40 text-xs">
          {chartData.length} days • Updated just now
        </p>
      </div>
    </div>
  );
};

export default RevenueChart;