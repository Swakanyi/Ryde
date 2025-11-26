import React, { useState, useEffect } from 'react';
import { 
  X, Download, Eye, CheckCircle, XCircle, 
  FileText, IdCard, Car, AlertCircle, Shield,
  Mail, Phone, Calendar, User
} from 'lucide-react';
import AdminService from '../../services/adminService';

const Documents = ({ driver, onClose, onApprove }) => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [approvalData, setApprovalData] = useState({
    action: 'approve',
    vehicle_type: driver?.user_type === 'boda_rider' ? 'boda' : 'economy',
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    reason: ''
  });

  useEffect(() => {
    if (driver) {
      fetchDocuments();
    }
  }, [driver]);

  const fetchDocuments = async () => {
    try {
      const data = await AdminService.getDriverDocuments(driver.id);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalData.license_plate || !approvalData.vehicle_type) {
      alert('Please fill in license plate and vehicle type');
      return;
    }

    try {
      await AdminService.approveDriverWithVehicle(driver.id, approvalData);
      onApprove();
      onClose();
    } catch (error) {
      alert('Error approving driver: ' + error.error);
    }
  };

  const handleReject = async () => {
    if (!approvalData.reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await AdminService.approveDriverWithVehicle(driver.id, {
        ...approvalData,
        action: 'reject'
      });
      onApprove();
      onClose();
    } catch (error) {
      alert('Error rejecting driver: ' + error.error);
    }
  };

const downloadDocument = async (documentType, documentUrl, filename) => {
  try {
    setDownloadLoading(prev => ({ ...prev, [documentType]: true }));
    await AdminService.downloadDriverDocument(driver.id, documentType);
  } catch (error) {
    console.error('Download failed:', error);
    window.open(documentUrl, '_blank');
  } finally {
    setDownloadLoading(prev => ({ ...prev, [documentType]: false }));
  }
};

const DocumentView = ({ title, documentUrl, icon: Icon, filename, documentType }) => (
  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-400" />
        <h4 className="text-white font-medium">{title}</h4>
      </div>
      <div className="flex gap-2">
        {documentUrl ? (
          <>
            <button
              onClick={() => window.open(documentUrl, '_blank')}
              className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="View document"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
  onClick={() => downloadDocument(documentType, documentUrl, filename)}
  disabled={downloadLoading[documentType]}
  className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
  title="Download document"
>
  {downloadLoading[documentType] ? (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  ) : (
    <Download className="w-4 h-4" />
  )}
</button>
          </>
        ) : (
          <span className="text-red-400 text-sm">Missing</span>
        )}
      </div>
    </div>
    
    {documentUrl ? (
      <div className="aspect-video bg-black/20 rounded-lg border border-white/10 flex items-center justify-center">
        
        {documentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
          <img 
            src={documentUrl} 
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <iframe 
            src={documentUrl} 
            className="w-full h-full rounded-lg"
            title={title}
          />
        )}
      </div>
    ) : (
      <div className="aspect-video bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
    )}
  </div>
);

  if (!driver) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
       
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-bold text-white">Review Driver Application</h2>
            <p className="text-white/60">Verify documents and approve/reject driver</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span className="text-white">{driver.first_name} {driver.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email:</span>
                  <span className="text-white">{driver.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Phone:</span>
                  <span className="text-white">{driver.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">License No:</span>
                  <span className="text-white">{driver.driver_license}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className="text-white capitalize">{driver.user_type}</span>
                </div>
              </div>
            </div>

            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Document Status
              </h3>
              <div className="space-y-2">
                {documents && Object.entries(documents.documents_status || {}).map(([doc, hasDoc]) => (
                  <div key={doc} className="flex justify-between items-center">
                    <span className="text-white/60 capitalize">{doc.replace('_', ' ')}:</span>
                    {hasDoc ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <DocumentView
    title="Driver License"
    documentUrl={documents?.driver_license_file_url}
    icon={IdCard}
    filename={`${driver.first_name}_license.pdf`}
    documentType="driver_license"
  />
  <DocumentView
    title="National ID"
    documentUrl={documents?.national_id_file_url}
    icon={FileText}
    filename={`${driver.first_name}_national_id.pdf`}
    documentType="national_id"
  />
  <DocumentView
    title="Vehicle Logbook"
    documentUrl={documents?.logbook_file_url}
    icon={Car}
    filename={`${driver.first_name}_logbook.pdf`}
    documentType="logbook"
  />
</div>

          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">Approval Action</h3>
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Vehicle Type *</label>
                <select
                  value={approvalData.vehicle_type}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="economy" className="text-black">Economy</option>
                  <option value="comfort" className="text-black">Comfort</option>
                  <option value="premium" className="text-black">Premium</option>
                  <option value="xl" className="text-black">XL</option>
                  <option value="boda" className="text-black">Boda</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">License Plate *</label>
                <input
                  type="text"
                  value={approvalData.license_plate}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, license_plate: e.target.value }))}
                  placeholder="e.g., KAA 123A"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Make</label>
                <input
                  type="text"
                  value={approvalData.make}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, make: e.target.value }))}
                  placeholder="e.g., Toyota"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Model</label>
                <input
                  type="text"
                  value={approvalData.model}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., Corolla"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">Rejection Reason (if rejecting)</label>
              <textarea
                value={approvalData.reason}
                onChange={(e) => setApprovalData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Provide reason for rejection..."
                rows="3"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
              />
            </div>

            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleReject}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Application
              </button>
              <button
                onClick={handleApprove}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Assign Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;