import React, { useState, useRef, useEffect } from 'react';
import { Shield, Upload, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Image, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { KYCService } from '../../services/kycService';
import { KYCDocument, KYCVerification } from '../../types/kyc';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function KYCVerificationView() {
  const { user, updateUser } = useAuth();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load KYC data when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log('KYCVerification: Loading KYC data for user:', user.id);
      loadKYCData();
    }
  }, [user?.id]);

  // Listen for KYC status updates from admin
  useEffect(() => {
    const handleKYCUpdates = (e: StorageEvent) => {
      if (!user) return;

      if (e.key === 'elitebet_kyc_approved' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            console.log('KYCVerification: Received approval notification');
            updateUser({ isVerified: true });
            toast.success('🎉 KYC Verification Approved! Your account is now fully verified.');
            loadKYCData(); // Refresh data
          }
        } catch (error) {
          console.error('KYCVerification: Failed to parse approval event:', error);
        }
      }

      if (e.key === 'elitebet_kyc_rejected' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            console.log('KYCVerification: Received rejection notification');
            toast.error(`❌ KYC Verification Rejected: ${data.reason}`);
            loadKYCData(); // Refresh data
          }
        } catch (error) {
          console.error('KYCVerification: Failed to parse rejection event:', error);
        }
      }
    };

    window.addEventListener('storage', handleKYCUpdates);
    return () => window.removeEventListener('storage', handleKYCUpdates);
  }, [user, updateUser]);

  const loadKYCData = () => {
    if (!user) return;
    
    try {
      const userDocs = KYCService.getUserDocuments(user.id);
      const userVerification = KYCService.getUserVerification(user.id);
      
      console.log('KYCVerification: Loaded data:', {
        documents: userDocs.length,
        verification: userVerification?.status || 'none'
      });
      
      setDocuments(userDocs);
      setVerification(userVerification);
    } catch (error) {
      console.error('KYCVerification: Failed to load KYC data:', error);
    }
  };

  const documentTypes = KYCService.getRequiredDocuments();

  const handleFileUpload = async (type: KYCDocument['type']) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) {
      console.log('KYCVerification: No file selected or user not found');
      return;
    }
    
    console.log('KYCVerification: Starting file upload:', { type, fileName: file.name, size: file.size });

    setUploadingType(type);
    setIsLoading(true);

    try {
      const document = await KYCService.uploadDocument(user.id, type, file);
      
      // Update local state
      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== type);
        return [document, ...filtered];
      });
      
      console.log('KYCVerification: Document uploaded successfully:', document.id);
      toast.success(`${KYCService.getDocumentTypeDisplayName(type)} uploaded successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('KYCVerification: Upload failed:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setUploadingType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const submitVerification = async () => {
    if (!user) return;

    const requiredDocs = documentTypes.filter(dt => dt.required);
    const uploadedRequiredDocs = documents.filter(doc => 
      requiredDocs.some(rd => rd.type === doc.type) && doc.status !== 'rejected'
    );

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      const missingDocs = requiredDocs.filter(rd => 
        !documents.some(doc => doc.type === rd.type && doc.status !== 'rejected')
      );
      toast.error(`Please upload required documents: ${missingDocs.map(d => d.name).join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      console.log('KYCVerification: Submitting verification for user:', user.id);
      const newVerification = await KYCService.submitVerification(user.id, 'enhanced');
      setVerification(newVerification);
      console.log('KYCVerification: Verification submitted successfully:', newVerification.id);
      toast.success('Verification submitted for review! You will be notified once reviewed.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      console.error('KYCVerification: Submission failed:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentStatus = (type: KYCDocument['type']) => {
    const doc = documents.find(d => d.type === type);
    return doc?.status || 'not_uploaded';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Upload className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    return KYCService.getDocumentStatusColor(status as KYCDocument['status']);
  };

  const viewDocument = (document: KYCDocument) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const canSubmitVerification = () => {
    const requiredDocs = documentTypes.filter(dt => dt.required);
    const uploadedRequiredDocs = documents.filter(doc => 
      requiredDocs.some(rd => rd.type === doc.type) && doc.status !== 'rejected'
    );
    return uploadedRequiredDocs.length >= requiredDocs.length && !verification;
  };

  return (
    <div className="space-y-6">
      {/* KYC Status Overview */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Account Verification Status</h3>
        </div>

        {user?.isVerified ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h4 className="font-medium text-green-400">Account Fully Verified ✅</h4>
            </div>
            <p className="text-slate-300">
              Your account has been successfully verified. You now have access to all platform features 
              including higher limits and priority support.
            </p>
          </div>
        ) : verification ? (
          <div className={`rounded-lg p-4 mb-4 border ${KYCService.getVerificationStatusColor(verification.status)}`}>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(verification.status)}
              <h4 className="font-medium">
                Verification Status: {verification.status.replace('_', ' ').toUpperCase()}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Level: <span className="text-white font-medium capitalize">{verification.verificationLevel}</span></p>
                <p className="text-slate-400">Submitted: <span className="text-white">{formatDate(verification.createdAt)}</span></p>
              </div>
              <div>
                <p className="text-slate-400">Documents: <span className="text-white">{verification.documents.length}</span></p>
                {verification.reviewedAt && (
                  <p className="text-slate-400">Reviewed: <span className="text-white">{formatDate(verification.reviewedAt)}</span></p>
                )}
              </div>
            </div>
            {verification.rejectionReason && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400 font-medium">Rejection Reason:</p>
                <p className="text-sm text-slate-300">{verification.rejectionReason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 font-medium">Account verification required</p>
            </div>
            <p className="text-slate-300 mt-1">
              Please upload the required documents to verify your account and unlock all features.
            </p>
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-6">Document Upload</h4>
        
        <div className="space-y-4">
          {documentTypes.map(docType => {
            const status = getDocumentStatus(docType.type as KYCDocument['type']);
            const isUploading = uploadingType === docType.type;
            const document = documents.find(d => d.type === docType.type);
            
            return (
              <div key={docType.type} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <div>
                      <h5 className="font-medium text-white">{docType.name}</h5>
                      {docType.required && <span className="text-red-400 text-xs font-medium">*Required</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                    {document && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(document)}
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 mb-4">{docType.description}</p>
                
                {document && document.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-400 font-medium">Rejection Reason:</p>
                    <p className="text-sm text-slate-300">{document.rejectionReason}</p>
                  </div>
                )}
                
                {(status === 'not_uploaded' || status === 'rejected') ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={() => handleFileUpload(docType.type as KYCDocument['type'])}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload {docType.name}</span>
                        </>
                      )}
                    </Button>
                    {status === 'rejected' && (
                      <span className="text-sm text-yellow-400">Please upload a new document</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Document uploaded</span>
                    {document && (
                      <span className="text-xs text-slate-400">
                        ({(document.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Verification */}
      {canSubmitVerification() && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-4">Submit for Verification</h4>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-400 mb-1">Verification Process</h5>
                <p className="text-sm text-slate-300">
                  Once you submit your documents, our compliance team will review them within 24-48 hours. 
                  You'll receive a notification once the review is complete.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={submitVerification}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Submitting for Review...</span>
              </div>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Submit for Verification
              </>
            )}
          </Button>
        </div>
      )}

      {/* Verification Benefits */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4">Verification Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Increased deposit limits ($50,000)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Faster withdrawal processing (24h)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Access to VIP promotions</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Enhanced account security</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Priority customer support</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Higher betting limits ($10,000)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {KYCService.getDocumentTypeDisplayName(selectedDocument.type)}
                </h3>
                <p className="text-sm text-slate-400">{selectedDocument.fileName}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowDocumentModal(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="text-center">
              {selectedDocument.fileUrl.startsWith('data:image/') ? (
                <img 
                  src={selectedDocument.fileUrl} 
                  alt={selectedDocument.type}
                  className="max-w-full max-h-[70vh] rounded-lg border border-slate-600"
                  onError={(e) => {
                    console.error('Failed to load document image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-slate-700 rounded-lg p-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">PDF Document</p>
                  <p className="text-sm text-slate-400">{selectedDocument.fileName}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-slate-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Status:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDocument.status)}`}>
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
                  <p className="text-white">{selectedDocument.expiresAt ? formatDate(selectedDocument.expiresAt) : 'Never'}</p>
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

      {/* Help Section */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4">Document Requirements</h4>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <p>Documents must be clear and readable</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <p>All four corners of the document must be visible</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <p>Documents must be current and not expired</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <p>Utility bills and bank statements must be from the last 3 months</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <p>Supported formats: JPG, PNG, PDF (max 5MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
}