import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, ArrowDownLeft, Building2, CreditCard, Smartphone, DollarSign, Upload, QrCode } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CloudinaryService } from '../../services/cloudinaryService';

export function DepositForm() {
  const { user } = useAuth();
  const { submitManualDeposit, isLoading, error, transactions, getBalance } = useWallet();
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>(''); // No default selection
  const [success, setSuccess] = useState<string | null>(null);
  const [showPendingDeposits, setShowPendingDeposits] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setCustomerName(`${user.firstName} ${user.lastName}`.trim());
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch payment methods from backend
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/betting/payment-config`);
      const data = await response.json();
      
      if (data.success && data.paymentMethods && data.paymentMethods.length > 0) {
        setPaymentMethods(data.paymentMethods);
        // DON'T auto-select - let user choose
        console.log('✅ Loaded', data.paymentMethods.length, 'payment methods');
      } else {
        // Fallback to hardcoded if API fails
        console.warn('Using fallback payment methods');
        setPaymentMethods(fallbackPaymentMethods);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      toast.error('Failed to load payment methods, using defaults');
      setPaymentMethods(fallbackPaymentMethods);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Fallback payment methods (if API fails)
  const fallbackPaymentMethods = [
    {
      method: 'phonepe',
      displayName: 'PhonePe / UPI',
      isActive: true,
      upiId: 'merchant@paytm',
      qrCodeUrl: '',
      minAmount: 100,
      maxAmount: 50000,
      processingTime: '5-10 minutes',
      instructions: '1. Scan QR or use UPI ID\n2. Make payment\n3. Upload screenshot'
    },
    {
      method: 'bank_transfer',
      displayName: 'Bank Transfer',
      isActive: true,
      bankDetails: {
        accountHolderName: 'Elite Bet Holdings Ltd',
        accountNumber: '034312010001727',
        ifscCode: 'UBIN0803430',
        bankName: 'Union Bank of India',
        branchName: 'Main Branch'
      },
      minAmount: 500,
      maxAmount: 100000,
      processingTime: '10-30 minutes',
      instructions: '1. Transfer to bank account\n2. Note transaction ID\n3. Upload payment proof'
    }
  ];

  console.log('DepositForm: isLoading =', isLoading, 'error =', error);

  // Get pending deposits
  const pendingDeposits = transactions?.filter(tx => 
    tx.type === 'deposit' && tx.status === 'pending'
  ) || [];

  const selectedPaymentMethod = paymentMethods.find(method => method.method === selectedMethod);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setPaymentScreenshot(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDepositSubmission = async () => {
    if (!amount || !customerName || !email || !transactionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedMethod === 'phonepe' && !upiId) {
      toast.error('Please enter PhonePe UPI ID for PhonePe payment');
      return;
    }

    if (!paymentScreenshot) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setUploading(true);
      
      // Upload screenshot to Cloudinary
      let screenshotUrl = '';
      if (paymentScreenshot) {
        toast.loading('Uploading payment screenshot...');
        const uploadResult = await CloudinaryService.uploadImage(paymentScreenshot, 'elite-bet/payment-proofs');
        screenshotUrl = uploadResult.url;
        toast.dismiss();
        toast.success('Screenshot uploaded successfully');
      }

      const depositTransactionId = `DEPOSIT_${Date.now()}`;
      
      console.log('DepositForm: Deposit request submitted', {
        amount: amountNum,
        customerName,
        email,
        upiId: selectedMethod === 'phonepe' ? upiId : undefined,
        transactionId,
        depositTransactionId,
        paymentMethod: selectedMethod,
        screenshotUrl
      });

      await submitManualDeposit({
        amount: amountNum,
        currency: 'INR',
        method: selectedMethod,
        transactionId: depositTransactionId,
        customerName,
        phoneNumber: email, // Using email as contact
        bankTransactionId: transactionId,
        base64Image: screenshotUrl, // Pass the Cloudinary URL
        metadata: {
          email,
          upiId: selectedMethod === 'phonepe' ? upiId : undefined,
          bankDetails: selectedPaymentMethod?.bankDetails,
          paymentProofUrl: screenshotUrl
        }
      });

      setSuccess(`Deposit request submitted successfully! Transaction ID: ${depositTransactionId}`);
      setAmount('');
      setCustomerName('');
      setEmail('');
      setUpiId('');
      setTransactionId('');
      setPaymentScreenshot(null);
      setScreenshotPreview(null);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);

    } catch (error: any) {
      console.error('DepositForm: Deposit submission error:', error);
      toast.error(error.message || 'Failed to submit deposit request');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <ArrowDownLeft className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
            <p className="text-slate-400">Add money to your account securely</p>
          </div>
        </div>

        {/* Balance Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Current Balance</p>
            <p className="text-white text-xl font-semibold">{formatCurrency(getBalance())}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Active Bets</p>
            <p className="text-yellow-400 text-xl font-semibold">$0.00</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Available for Deposit</p>
            <p className="text-green-400 text-xl font-semibold">Unlimited</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Deposit Form */}
      <div className="p-6">
        {/* Payment Method Selection - MUST BE FIRST */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Step 1: Select Payment Method *
          </label>
          {loadingMethods ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
              <p className="text-yellow-400">No payment methods available. Please contact admin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.method}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === method.method
                      ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    console.log('User selected payment method:', method.method);
                    setSelectedMethod(method.method);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        method.method === 'bank_transfer' ? 'bg-blue-500/10 text-blue-400' :
                        method.method === 'phonepe' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {method.method === 'bank_transfer' ? <Building2 className="w-5 h-5" /> :
                         <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{method.displayName}</h4>
                        <p className="text-slate-400 text-sm">
                          Min: ₹{method.minAmount} | Max: ₹{method.maxAmount}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Processing Time</p>
                      <p className="text-slate-300 text-sm font-medium">{method.processingTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PhonePe / UPI Payment Details - ONLY SHOW AFTER SELECTION */}
        {selectedMethod && selectedPaymentMethod && selectedPaymentMethod.method === 'phonepe' && (
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="text-purple-400 font-semibold mb-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Step 2: PhonePe / UPI Payment Details
            </h4>
            <p className="text-sm text-slate-400 mb-4">Use any of these methods to make your payment</p>
            
            {/* QR Code */}
            {selectedPaymentMethod.qrCodeUrl && 
             selectedPaymentMethod.qrCodeUrl.includes('cloudinary.com') ? (
              <div className="mb-6 text-center">
                <p className="text-sm text-slate-400 mb-3">💳 Scan QR Code with any UPI app:</p>
                <div className="inline-block bg-white p-4 rounded-lg shadow-lg">
                  <img
                    src={selectedPaymentMethod.qrCodeUrl}
                    alt="PhonePe QR Code"
                    className="w-64 h-64 object-contain"
                    onError={() => {
                      console.error('QR code failed to load:', selectedPaymentMethod.qrCodeUrl);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-yellow-400 font-semibold mb-2">QR Code Not Available</p>
                <p className="text-sm text-slate-400">
                  Admin hasn't uploaded a QR code yet. Please use the UPI ID below to make your payment.
                </p>
              </div>
            )}
            
            {/* UPI ID */}
            {selectedPaymentMethod.upiId ? (
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">📱 Or use UPI ID:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 px-4 py-3 rounded text-white font-mono text-lg border border-slate-600">
                    {selectedPaymentMethod.upiId}
                  </code>
                  <Button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPaymentMethod.upiId);
                      toast.success('UPI ID copied to clipboard!');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400 text-center">
                  ⚠️ UPI ID not configured. Please contact admin.
                </p>
              </div>
            )}
            
            {/* Instructions */}
            {selectedPaymentMethod.instructions && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
                <p className="text-sm text-slate-400 mb-2 font-medium">Instructions:</p>
                <p className="text-sm text-slate-300 whitespace-pre-line">{selectedPaymentMethod.instructions}</p>
              </div>
            )}
            
            {/* Min/Max Info */}
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span>Min: ₹{selectedPaymentMethod.minAmount}</span>
              <span>•</span>
              <span>Max: ₹{selectedPaymentMethod.maxAmount}</span>
              <span>•</span>
              <span>Processing: {selectedPaymentMethod.processingTime}</span>
            </div>
          </div>
        )}

        {/* Bank Transfer Payment Details - ONLY SHOW AFTER SELECTION */}
        {selectedMethod && selectedPaymentMethod && selectedPaymentMethod.method === 'bank_transfer' && selectedPaymentMethod.bankDetails && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-400 font-semibold mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Step 2: Bank Transfer Details
            </h4>
            <p className="text-sm text-slate-400 mb-4">Transfer money to this bank account</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Holder:</span>
                <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.accountHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number:</span>
                <span className="text-white font-medium font-mono">{selectedPaymentMethod.bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC Code:</span>
                <span className="text-white font-medium font-mono">{selectedPaymentMethod.bankDetails.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Name:</span>
                <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.bankName}</span>
              </div>
              {selectedPaymentMethod.bankDetails.branchName && (
                <div className="flex justify-between col-span-2">
                  <span className="text-slate-400">Branch:</span>
                  <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.branchName}</span>
                </div>
              )}
            </div>
            
            {/* Copy Button */}
            <Button
              onClick={() => {
                const details = `Account: ${selectedPaymentMethod.bankDetails.accountNumber}\nIFSC: ${selectedPaymentMethod.bankDetails.ifscCode}\nBank: ${selectedPaymentMethod.bankDetails.bankName}`;
                navigator.clipboard.writeText(details);
                toast.success('Bank details copied to clipboard!');
              }}
              variant="outline"
              size="sm"
              fullWidth
              className="mt-4"
            >
              Copy Bank Details
            </Button>
            
            {/* Instructions */}
            {selectedPaymentMethod.instructions && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
                <p className="text-sm text-slate-400 mb-2 font-medium">Instructions:</p>
                <p className="text-sm text-slate-300 whitespace-pre-line">{selectedPaymentMethod.instructions}</p>
              </div>
            )}
            
            {/* Min/Max Info */}
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span>Min: ₹{selectedPaymentMethod.minAmount}</span>
              <span>•</span>
              <span>Max: ₹{selectedPaymentMethod.maxAmount}</span>
              <span>•</span>
              <span>Processing: {selectedPaymentMethod.processingTime}</span>
            </div>
          </div>
        )}

        {/* Message when no payment method selected */}
        {!selectedMethod && !loadingMethods && paymentMethods.length > 0 && (
          <div className="mb-6 p-8 bg-slate-800/50 border border-slate-600 rounded-lg text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Select a Payment Method</h3>
            <p className="text-slate-400">
              Choose your preferred payment method above to continue with the deposit
            </p>
          </div>
        )}

        {/* Only show form after payment method is selected */}
        {selectedMethod && (
        <form onSubmit={(e) => { e.preventDefault(); handleDepositSubmission(); }} className="space-y-6">
          {/* Deposit Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Step 3: Enter Deposit Amount
            </label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="0.01"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Customer Details - DISABLED (Auto-filled from user) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Step 4: Your Name *
              </label>
              <Input
                type="text"
                value={customerName}
                disabled
                className="bg-slate-600 border-slate-500 text-slate-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-slate-600 border-slate-500 text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Step 5: Transaction ID *
            </label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter your bank/PhonePe transaction ID"
              required
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* UPI ID for PhonePe */}
          {selectedMethod === 'phonepe' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                PhonePe UPI ID *
              </label>
              <Input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter your PhonePe UPI ID (e.g., yourname@paytm)"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Step 6: Upload Payment Screenshot *
            </label>
            <div className="space-y-3">
              {!paymentScreenshot ? (
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-screenshot"
                  />
                  <label
                    htmlFor="payment-screenshot"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Upload Payment Screenshot</p>
                      <p className="text-slate-400 text-sm mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative border border-slate-600 rounded-lg overflow-hidden">
                  <img
                    src={screenshotPreview || ''}
                    alt="Payment Screenshot"
                    className="w-full h-64 object-contain bg-slate-900"
                  />
                  <button
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || uploading || !selectedMethod}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isLoading || uploading) ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                <span>{uploading ? 'Uploading Screenshot...' : 'Submitting Request...'}</span>
              </div>
            ) : (
              'Submit Deposit Request'
            )}
          </Button>
        </form>
        )}

        {/* Pending Deposits Section */}
        {pendingDeposits.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" /> 
                Pending Deposits ({pendingDeposits.length})
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowPendingDeposits(!showPendingDeposits)}
                className="text-blue-400 hover:text-blue-300 border-blue-500/20"
              >
                {showPendingDeposits ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showPendingDeposits && (
              <div className="space-y-3">
                {pendingDeposits.map((deposit) => (
                  <div key={deposit.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-yellow-400">Deposit of {formatCurrency(deposit.amount)}</span>
                      <span className="text-sm text-yellow-300">{formatDate(deposit.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p className="text-yellow-300">Status: <span className="font-semibold capitalize">{deposit.status}</span></p>
                      <p className="text-yellow-300">Method: <span className="font-semibold capitalize">{deposit.method?.replace(/_/g, ' ')}</span></p>
                      {deposit.metadata?.bankTransactionId && (
                        <p className="text-yellow-300">Bank Txn ID: <span className="font-semibold">{deposit.metadata.bankTransactionId}</span></p>
                      )}
                      {deposit.metadata?.customerName && (
                        <p className="text-yellow-300">Name: <span className="font-semibold">{deposit.metadata.customerName}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
          <h4 className="text-white font-medium mb-2">How it works:</h4>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>Select payment method and see bank details</li>
            <li>Make payment to the provided account details</li>
            <li>Fill in your personal details and transaction ID</li>
            <li>Submit the request for admin verification</li>
            <li>Admin will verify and approve your deposit</li>
            <li>Your balance will be updated within 30 minutes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}