import { useState, useEffect } from 'react';
import { Shield, Upload, Phone, Mail, FileText, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/SupabaseAuthContext';
import toast from 'react-hot-toast';

export function KYCVerificationPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [documentType, setDocumentType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showOTPInstructions, setShowOTPInstructions] = useState(false);

  useEffect(() => {
    if (user) {
      loadKYCStatus();
    }
  }, [user]);

  const loadKYCStatus = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/kyc/status/${user!.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.kycStatus);
      }
    } catch (error) {
      console.error('Failed to load KYC status:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dy9zlgjh6';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'kyc_documents');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setDocumentImage(data.secure_url);
      setImagePreview(data.secure_url);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!phoneNumber || !documentNumber || !documentImage) {
      toast.error('Please fill all fields and upload document');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          phoneNumber,
          documentType,
          documentNumber,
          documentImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit KYC');
      }

      const data = await response.json();
      setKycStatus(data.kycStatus);
      setStep(2);
      toast.success('KYC documents submitted successfully');
    } catch (error) {
      toast.error('Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/kyc/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send OTP');
      }

      const data = await response.json();
      setOtpSent(true);
      setShowOTPInstructions(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/kyc/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          otp
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid OTP');
      }

      const data = await response.json();
      setKycStatus(data.kycStatus);
      toast.success(data.message, { duration: 5000 });
      
      // Refresh page after 2 seconds to show new balance
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Please login to continue</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
          <p className="text-slate-400">Verify your identity to get ₹100 bonus!</p>
        </div>

        {/* Status Display */}
        {kycStatus === 'approved' && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-green-400">KYC Verified!</h3>
                <p className="text-slate-300">Your account is fully verified</p>
              </div>
            </div>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">KYC Rejected</h3>
                <p className="text-slate-300">Please contact support or resubmit</p>
              </div>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && step === 2 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400">Verification Pending</h3>
                <p className="text-slate-300">Please verify your email with OTP</p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Form */}
        {(kycStatus === 'not_submitted' || (kycStatus === 'pending' && step === 1)) && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Submit Documents</h2>
            
            {/* Phone Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
              />
            </div>

            {/* Document Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Document Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDocumentType('aadhaar')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'aadhaar'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-slate-600 bg-slate-700'
                  }`}
                >
                  <span className="text-white font-medium">Aadhaar Card</span>
                </button>
                <button
                  onClick={() => setDocumentType('pan')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'pan'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-slate-600 bg-slate-700'
                  }`}
                >
                  <span className="text-white font-medium">PAN Card</span>
                </button>
              </div>
            </div>

            {/* Document Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {documentType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}
              </label>
              <Input
                type="text"
                placeholder={documentType === 'aadhaar' ? 'XXXX XXXX XXXX' : 'XXXXXXXXXX'}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                maxLength={documentType === 'aadhaar' ? 12 : 10}
              />
            </div>

            {/* Document Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Document Image
              </label>
              
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Document preview" 
                    className="rounded-lg max-h-48 border-2 border-green-500"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setDocumentImage(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-red-500 transition-colors">
                    {uploadingImage ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400">Click to upload document</p>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            <Button
              onClick={handleSubmitKYC}
              disabled={loading || !phoneNumber || !documentNumber || !documentImage}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Submit KYC Documents'}
            </Button>
          </div>
        )}

        {/* OTP Verification */}
        {kycStatus === 'pending' && step === 2 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Email Verification</h2>
            
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-slate-300 text-sm">
                    We'll send an OTP to your registered email: <span className="font-semibold text-white">{user.email}</span>
                  </p>
                </div>
              </div>
            </div>

            {!otpSent ? (
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Send OTP to Email'}
              </Button>
            ) : (
              <>
                {/* OTP Instructions */}
                {showOTPInstructions && (
                  <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-slate-200">
                        <p className="font-semibold mb-2">📧 Email not configured on server</p>
                        <p className="mb-2">
                          <strong>For Testing:</strong> The OTP code is displayed in the backend terminal/console.
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                          <li>Open your backend terminal window</li>
                          <li>Look for a box showing your OTP code</li>
                          <li>Copy the 6-digit code</li>
                          <li>Paste it below and verify</li>
                        </ol>
                        <p className="mt-2 text-xs text-yellow-300">
                          💡 To receive OTP via email, configure SMTP settings in backend/.env
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Enter 6-Digit OTP
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-2">OTP expires in 10 minutes</p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Verify & Get ₹100 Bonus'}
                  </Button>
                  <Button
                    onClick={handleSendOTP}
                    variant="outline"
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Benefits */}
        {kycStatus === 'not_submitted' && (
          <div className="mt-8 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl border border-red-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Why Verify?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-slate-300">Get instant ₹100 bonus in your account</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-slate-300">Secure your account and withdrawals</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-slate-300">Fast and easy process (2-3 minutes)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

