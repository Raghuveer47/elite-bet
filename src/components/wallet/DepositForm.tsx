import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, ArrowDownLeft, Building2, CreditCard, Smartphone, DollarSign, Eye, Upload } from 'lucide-react';
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
  const [selectedMethod, setSelectedMethod] = useState<string>('union_bank_india');
  const [showBankDetails, setShowBankDetails] = useState(true); // Show by default
  const [success, setSuccess] = useState<string | null>(null);
  const [showPendingDeposits, setShowPendingDeposits] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setCustomerName(`${user.firstName} ${user.lastName}`.trim());
      setEmail(user.email || '');
    }
  }, [user]);

  console.log('DepositForm: isLoading =', isLoading, 'error =', error);

  // Get pending deposits
  const pendingDeposits = transactions?.filter(tx => 
    tx.type === 'deposit' && tx.status === 'pending'
  ) || [];

  // Payment methods
  const paymentMethods = [
    {
      id: 'union_bank_india',
      name: 'Union Bank of India',
      description: 'Bank Transfer to Union Bank Account',
      bankDetails: {
        bankName: 'Union Bank of India',
        accountName: 'Elite Bet Holdings Ltd',
        accountNumber: '034312010001727',
        ifscCode: 'UBIN0803430',
        phoneNumber: '8712243286',
        branchName: 'Union Bank Branch'
      }
    },
    {
      id: 'phonepe',
      name: 'PhonePe Payment',
      description: 'Pay via PhonePe UPI',
      bankDetails: {
        bankName: 'PhonePe UPI',
        accountName: 'Elite Bet Holdings Ltd',
        accountNumber: '8712243286',
        ifscCode: 'N/A',
        phoneNumber: '8712243286',
        branchName: 'PhonePe UPI'
      }
    }
  ];

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);

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
      setShowBankDetails(false);
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
        {/* Bank Details Display - MOVED ABOVE FORM */}
        {selectedPaymentMethod && showBankDetails && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Payment Details (Make payment to these details)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank:</span>
                <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Name:</span>
                <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number:</span>
                <span className="text-white font-medium font-mono">{selectedPaymentMethod.bankDetails.accountNumber}</span>
              </div>
              {selectedPaymentMethod.bankDetails.ifscCode !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="text-white font-medium font-mono">{selectedPaymentMethod.bankDetails.ifscCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-white font-medium">{selectedPaymentMethod.bankDetails.phoneNumber}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleDepositSubmission(); }} className="space-y-6">
          {/* Deposit Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Deposit Amount
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
                Your Name *
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
              Transaction ID *
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

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setShowBankDetails(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        method.id === 'union_bank_india' ? 'bg-blue-500/10 text-blue-400' :
                        method.id === 'phonepe' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {method.id === 'union_bank_india' ? <Building2 className="w-5 h-5" /> :
                         method.id === 'phonepe' ? <Smartphone className="w-5 h-5" /> :
                         <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{method.name}</h4>
                        <p className="text-slate-400 text-sm">{method.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Admin will process manually</p>
                      <p className="text-slate-500 text-xs">Processing Time: 1-2 business days</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Screenshot *
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
            disabled={isLoading || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
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