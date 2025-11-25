import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const VehicleTypeChart = ({ data, loading }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data?.by_vehicle_type) {
     
      const transformedData = data.by_vehicle_type.map(vehicle => ({
        name: vehicle.vehicle_type?.charAt(0).toUpperCase() + vehicle.vehicle_type?.slice(1) || 'Unknown',
        value: vehicle.total_earnings || 0,
        rides: vehicle.total_rides || 0
      }));
      setChartData(transformedData);
    } else if (data) {
      
      const totalEarnings = data.summary?.total_earnings || 1050000;
      setChartData([
        { name: 'Standard', value: Math.round(totalEarnings * 0.43), rides: 1250 },
        { name: 'Premium', value: Math.round(totalEarnings * 0.27), rides: 560 },
        { name: 'Boda', value: Math.round(totalEarnings * 0.30), rides: 1800 }
      ]);
    }
  }, [data]); 

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/60">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            color: 'white'
          }}
          formatter={(value, name, props) => {
            if (props.dataKey === 'value') {
              return [`Ksh${value.toLocaleString()}`, 'Revenue'];
            }
            return [value, name];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default VehicleTypeChart;