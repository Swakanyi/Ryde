import React from 'react';
import { X, User, MapPin, Clock, DollarSign, Car, Navigation, Phone, Mail } from 'lucide-react';

const RideDetailsModal = ({ ride, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-xl font-bold">Ride Details #{ride.id}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Ride Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Status:</span>
                  <span className="text-white capitalize">{ride.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Vehicle Type:</span>
                  <span className="text-white capitalize">{ride.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Fare:</span>
                  <span className="text-white">Ksh {ride.fare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Created:</span>
                  <span className="text-white">{new Date(ride.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

           
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Route</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white/60 text-xs">Pickup</p>
                    <p className="text-white text-sm">{ride.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white/60 text-xs">Dropoff</p>
                    <p className="text-white text-sm">{ride.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

         
          {ride.customer_name && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span className="text-white">{ride.customer_name}</span>
                </div>
                {ride.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Phone:</span>
                    <span className="text-white">{ride.customer_phone}</span>
                  </div>
                )}
                {ride.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Email:</span>
                    <span className="text-white">{ride.customer_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

         
          {ride.driver_name && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Driver Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span className="text-white">{ride.driver_name}</span>
                </div>
                {ride.driver_phone && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Phone:</span>
                    <span className="text-white">{ride.driver_phone}</span>
                  </div>
                )}
                {ride.vehicle_plate && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Vehicle Plate:</span>
                    <span className="text-white">{ride.vehicle_plate}</span>
                  </div>
                )}
                {ride.vehicle_model && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Vehicle Model:</span>
                    <span className="text-white">{ride.vehicle_model}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetailsModal;