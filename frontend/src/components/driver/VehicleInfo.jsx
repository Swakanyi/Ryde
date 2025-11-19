
import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Shield, 
  FileCheck, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';

const VehicleInfo = () => {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 
  useEffect(() => {

    setTimeout(() => {
      setVehicleData({
        license_plate: 'KCA 123A',
        vehicle_type: 'comfort',
        make: 'Toyota',
        model: 'Noah',
        year: 2022,
        color: 'White',
        insurance_number: 'INS-789012',
        insurance_expiry: '2024-12-31',
        is_approved: true,
        vehicle_approval_status: 'approved'
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getApprovalStatus = (status) => {
    switch (status) {
      case 'approved':
        return { 
          color: 'text-green-400 bg-green-400/20', 
          icon: CheckCircle, 
          label: 'Approved' 
        };
      case 'pending':
        return { 
          color: 'text-yellow-400 bg-yellow-400/20', 
          icon: AlertCircle, 
          label: 'Pending Review' 
        };
      case 'rejected':
        return { 
          color: 'text-red-400 bg-red-400/20', 
          icon: XCircle, 
          label: 'Rejected' 
        };
      default:
        return { 
          color: 'text-gray-400 bg-gray-400/20', 
          icon: AlertCircle, 
          label: 'Unknown' 
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

 
  const approvalStatus = vehicleData ? getApprovalStatus(vehicleData.vehicle_approval_status) : getApprovalStatus('unknown');
  const StatusIcon = approvalStatus.icon;

  return (
    <div className="space-y-6">
   
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Vehicle Information</h2>
          <p className="text-white/60">Manage your vehicle details and documents</p>
        </div>
        <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {error && (
        <div className="bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {vehicleData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              Vehicle Details
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60">License Plate</span>
                <span className="text-white font-semibold">{vehicleData.license_plate}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60">Vehicle Type</span>
                <span className="text-white font-semibold capitalize">{vehicleData.vehicle_type}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60">Make & Model</span>
                <span className="text-white font-semibold">{vehicleData.make} {vehicleData.model}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60">Year</span>
                <span className="text-white font-semibold">{vehicleData.year}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/60">Color</span>
                <span className="text-white font-semibold capitalize">{vehicleData.color}</span>
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Approval Status
              </h3>

              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${approvalStatus.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {approvalStatus.label}
                </div>
              </div>

              {vehicleData.vehicle_approval_status === 'pending' && (
                <p className="text-white/60 text-sm">
                  Your vehicle is under review. This usually takes 1-2 business days.
                </p>
              )}
            </div>

          
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                Insurance Details
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Insurance Number</span>
                  <span className="text-white font-semibold">{vehicleData.insurance_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Expiry Date</span>
                  <span className={`font-semibold ${
                    new Date(vehicleData.insurance_expiry) > new Date() 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {new Date(vehicleData.insurance_expiry).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {new Date(vehicleData.insurance_expiry) < new Date() && (
                <div className="mt-4 p-3 bg-red-400/20 border border-red-400/30 rounded-xl">
                  <p className="text-red-300 text-sm font-medium">
                    Your insurance has expired. Please update your insurance details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button className="flex-1 bg-emerald-500 text-white py-3 px-6 rounded-xl hover:bg-emerald-600 transition-colors font-semibold">
          Update Documents
        </button>
        <button className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl border border-white/20 hover:bg-white/20 transition-colors font-semibold">
          View Requirements
        </button>
      </div>
    </div>
  );
};

export default VehicleInfo;