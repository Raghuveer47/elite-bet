import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Image } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { KYCService } from '../../services/kycService';
import { KYCVerification, KYCDocument } from '../../types/kyc';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

function getDocumentTypeIcon(type: KYCDocument['type']) {
  switch (type) {
    case 'passport': return '📘';
    case 'id_card': return '🆔';
    case 'drivers_license': return '🚗';
    case 'utility_bill': return '📄';
    case 'bank_statement': return '🏦';
    case 'proof_of_funds': return '💰';
    default: return '📄';
  }
}

export function KYCManagement() {
  const { users, isLoading: adminLoading } = useAdmin();
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Load KYC data when component mounts
  useEffect(() => {
    console.log('KYCManagement: Loading KYC data...');
    loadKYCData();
    
    // Listen for new KYC submissions
    const handleKYCEvents = (e: StorageEvent) => {
      if (e.key === 'elitebet_kyc_verification_submitted' && e.newValue) {
        try {
          const verification = JSON.parse(e.newValue);
          console.log('KYCManagement: New verification received:', verification.id);
          setVerifications(prev => {
            const exists = prev.some(v => v.id === verification.id);
            if (!exists) {
              const user = users.find(u => u.id === verification.userId);
              toast.success(`New KYC verification submitted by ${user?.firstName || 'User'} ${user?.lastName || ''}`);
              return [verification, ...prev];
            }
            return prev;
          });
        } catch (error) {
          console.error('KYCManagement: Failed to parse KYC event:', error);
        }
      }
      
      if (e.key === 'elitebet_kyc_document_uploaded' && e.newValue) {
        try {
          const document = JSON.parse(e.newValue);
          console.log('KYCManagement: New document uploaded:', document.id);
          // Refresh data to get latest documents
          setTimeout(() => loadKYCData(), 500);
        } catch (error) {
          console.error('KYCManagement: Failed to parse document event:', error);
        }
      }
    };

    window.addEventListener('storage', handleKYCEvents);
    return () => window.removeEventListener('storage', handleKYCEvents);
  }, [users]);

  const loadKYCData = () => {
    try {
      const allVerifications = KYCService.getAllVerifications();
      console.log('KYCManagement: Loaded verifications:', allVerifications.length);
      setVerifications(allVerifications);
    } catch (error) {
      console.error('KYCManagement: Failed to load KYC data:', error);
    }
  };

  const handleApproveVerification = async (verificationId: string) => {
    setIsLoading(true);
    try {
      console.log('KYCManagement: Approving verification:', verificationId);
      
      const verification = verifications.find(v => v.id === verificationId);
      if (!verification) {
        throw new Error('Verification not found');
      }

      await KYCService.approveVerification(verificationId, 'admin_1');
      
      // Update local state
      setVerifications(prev => prev.map(v => 
        v.id === verificationId 
          ? { ...v, status: 'approved', reviewedAt: new Date(), reviewedBy: 'admin_1' }
          : v
      ));
      
      // Update user verification status in admin context
      const user = users.find(u => u.id === verification.userId);
      if (user) {
        // Trigger user verification update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'elitebet_user_verified',
          newValue: JSON.stringify({ userId: verification.userId })
        }));
      }
      
      console.log('KYCManagement: Verification approved successfully');
      toast.success(`Verification approved for ${user?.firstName || 'User'} ${user?.lastName || ''}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve verification';
      console.error('KYCManagement: Approval failed:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectVerification = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      console.log('KYCManagement: Rejecting verification:', selectedVerification.id);
      await KYCService.rejectVerification(selectedVerification.id, 'admin_1', rejectionReason);
      
      // Update local state
      setVerifications(prev => prev.map(v => 
        v.id === selectedVerification.id 
          ? { ...v, status: 'rejected', reviewedAt: new Date(), reviewedBy: 'admin_1', rejectionReason }
          : v
      ));
      
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedVerification(null);
      
      const user = users.find(u => u.id === selectedVerification.userId);
      console.log('KYCManagement: Verification rejected successfully');
      toast.success(`Verification rejected for ${user?.firstName || 'User'} ${user?.lastName || ''}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject verification';
      console.error('KYCManagement: Rejection failed:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: KYCVerification['status']) => {
    return KYCService.getVerificationStatusColor(status);
  };

  const filteredVerifications = verifications.filter(verification => 
    statusFilter === 'all' || verification.status === statusFilter
  );

  const verificationStats = {
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
    inReview: verifications.filter(v => v.status === 'in_review').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">KYC Management</h1>
          <p className="text-slate-400">Review and manage user verification requests</p>
        </div>
        <Button variant="outline" onClick={loadKYCData} disabled={isLoading}>
          <Shield className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* KYC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">{verificationStats.pending}</span>
          </div>
          <p className="text-slate-400 text-sm">Pending Reviews</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">{verificationStats.approved}</span>
          </div>
          <p className="text-slate-400 text-sm">Approved</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{verificationStats.rejected}</span>
          </div>
          <p className="text-slate-400 text-sm">Rejected</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.isVerified).length}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Verified Users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Verification Requests</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Verifications List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {(isLoading || adminLoading) ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No verification requests found</p>
            {statusFilter !== 'all' && (
              <Button variant="outline" className="mt-4" onClick={() => setStatusFilter('all')}>
                Show All Verifications
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredVerifications.map(verification => {
                  const user = users.find(u => u.id === verification.userId);
                  
                  return (
                    <tr key={verification.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                          </p>
                          <p className="text-xs text-slate-400">{user?.email || 'No email'}</p>
                          <p className="text-xs text-slate-500">ID: {verification.userId.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-blue-400 capitalize">
                          {verification.verificationLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {verification.documents.slice(0, 3).map(doc => (
                              <span key={doc.id} className="text-lg" title={KYCService.getDocumentTypeDisplayName(doc.type)}>
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                            ))}
                            {verification.documents.length > 3 && (
                              <span className="text-xs text-slate-400">+{verification.documents.length - 3}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">({verification.documents.length})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(verification.status)}`}>
                          {verification.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">{formatDate(verification.createdAt)}</div>
                        {verification.reviewedAt && (
                          <div className="text-xs text-slate-400">
                            Reviewed: {formatDate(verification.reviewedAt)}
                          </div>
                        )}
                        {verification.expiresAt && (
                          <div className="text-xs text-slate-500">
                            Expires: {formatDate(verification.expiresAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setShowDocumentModal(true);
                            }}
                            title="View Documents"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {verification.status === 'pending' && (
                            <>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleApproveVerification(verification.id)}
                                disabled={isLoading}
                                title="Approve Verification"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setShowRejectionModal(true);
                                }}
                                disabled={isLoading}
                                title="Reject Verification"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Review Modal */}
      {showDocumentModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Document Review</h3>
                <p className="text-sm text-slate-400">
                  User: {users.find(u => u.id === selectedVerification.userId)?.email || 'Unknown'}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setShowDocumentModal(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {selectedVerification.documents.map(document => (
                <div key={document.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getDocumentTypeIcon(document.type)}</span>
                      <div>
                        <h4 className="font-medium text-white text-sm">
                          {KYCService.getDocumentTypeDisplayName(document.type)}
                        </h4>
                        <p className="text-xs text-slate-400">{document.fileName}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${KYCService.getDocumentStatusColor(document.status)}`}>
                      {document.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    {document.fileUrl.startsWith('data:image/') ? (
                      <img 
                        src={document.fileUrl} 
                        alt={document.type}
                        className="w-full h-32 object-contain bg-white rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedDocument(document)}
                        onError={(e) => {
                          console.error('Failed to load document image:', document.id);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-slate-600 rounded border flex items-center justify-center cursor-pointer hover:bg-slate-500 transition-colors"
                           onClick={() => setSelectedDocument(document)}>
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Uploaded: {formatDate(document.uploadedAt)}</p>
                    <p>Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    {document.rejectionReason && (
                      <p className="text-red-400">Reason: {document.rejectionReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedVerification.status === 'pending' && (
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="danger"
                  onClick={() => {
                    setShowRejectionModal(true);
                    setShowDocumentModal(false);
                  }}
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    handleApproveVerification(selectedVerification.id);
                    setShowDocumentModal(false);
                  }}
                  disabled={isLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {KYCService.getDocumentTypeDisplayName(selectedDocument.type)}
                </h3>
                <p className="text-sm text-slate-400">{selectedDocument.fileName}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedDocument(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              {selectedDocument.fileUrl.startsWith('data:image/') ? (
                <img 
                  src={selectedDocument.fileUrl} 
                  alt={selectedDocument.type}
                  className="max-w-full max-h-[60vh] rounded-lg border border-slate-600"
                  onError={(e) => {
                    console.error('Failed to load document image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-slate-700 rounded-lg p-12">
                  <FileText className="w-24 h-24 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 text-lg">PDF Document</p>
                  <p className="text-sm text-slate-400">{selectedDocument.fileName}</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Status:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${KYCService.getDocumentStatusColor(selectedDocument.status)}`}>
                    {selectedDocument.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400">Uploaded:</p>
                  <p className="text-white">{formatDate(selectedDocument.uploadedAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400">File Size:</p>
                  <p className="text-white">{(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-slate-400">Expires:</p>
                  <p className="text-white">
                    {selectedDocument.expiresAt ? formatDate(selectedDocument.expiresAt) : 'Never'}
                  </p>
                </div>
              </div>
              {selectedDocument.rejectionReason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400 font-medium">Rejection Reason:</p>
                  <p className="text-sm text-slate-300">{selectedDocument.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Reject Verification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>
              
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">Important Notice</p>
                    <p className="text-xs text-slate-300">
                      The user will be notified of the rejection and can resubmit documents. 
                      Please provide clear guidance on what needs to be corrected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedVerification(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleRejectVerification}
                disabled={!rejectionReason.trim() || isLoading}
              >
                {isLoading ? 'Rejecting...' : 'Reject Verification'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}