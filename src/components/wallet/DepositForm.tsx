import React, { useState, useRef } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Upload, X, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useWallet } from '../../contexts/WalletContext';
import { PaymentMethod, BankDetails } from '../../types/wallet';
import { formatCurrency } from '../../lib/utils';

export function DepositForm() {
  const { paymentMethods, limits, submitManualDeposit, isLoading, error, stats } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankDetails: BankDetails = {
    bankName: 'Elite Bet Financial Services',
    accountName: 'Elite Bet Holdings Ltd',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    swiftCode: 'EBTFUS33',
    iban: 'US64EBTF0210000021234567890',
    reference: `DEPOSIT_${Date.now()}`
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors and success messages
    setSuccess(null);
    
    if (!selectedMethod || !amount) {
      toast.error('Please select payment method and enter amount');
      return;
    }

    const amountValue = parseFloat(amount);
    
    // Validate amount
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amountValue < limits.minDeposit) {
      toast.error(`Minimum deposit is ${formatCurrency(limits.minDeposit)}`);
      return;
    }
    
    if (amountValue > limits.maxDeposit) {
      toast.error(`Maximum deposit is ${formatCurrency(limits.maxDeposit)}`);
      return;
    }

    // Check daily limits
    const todayDeposits = stats.todayDeposited;
    if (todayDeposits + amountValue > limits.dailyDepositLimit) {
      toast.error(`Daily deposit limit of ${formatCurrency(limits.dailyDepositLimit)} would be exceeded`);
      return;
    }

    // Show bank details popup
    setShowBankDetails(true);
  };

  const handlePaymentSubmission = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter the transaction ID');
      return;
    }
    
    if (!paymentProof) {
      toast.error('Please upload payment screenshot');
      return;
    }

    try {
      setSuccess(null);
      
      // Convert file to base64 for proper storage and display
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(paymentProof);
      });
      
      const depositRequest = {
        amount: parseFloat(amount),
        currency: 'USD',
        method: selectedMethod!.id,
        transactionId: transactionId.trim(),
        paymentProof,
        base64Image
      };

      await submitManualDeposit(depositRequest);
      
      setSuccess('Payment submitted successfully! Your deposit is now pending admin approval. You will be notified once it\'s processed.');
      toast.success('Payment submitted for verification!');
      
      console.log('Deposit form: Payment submitted successfully', {
        amount: parseFloat(amount),
        transactionId: transactionId.trim(),
        method: selectedMethod!.id
      });
      
      // Reset form after successful submission
      setTimeout(() => {
        setAmount('');
        setSelectedMethod(null);
        setTransactionId('');
        setPaymentProof(null);
        setShowBankDetails(false);
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment submission failed';
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      e.target.value = ''; // Reset input
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      e.target.value = ''; // Reset input
      return;
    }
    
    setPaymentProof(file);
    toast.success('Payment screenshot uploaded successfully');
  };

  const handleBackToForm = () => {
    setShowBankDetails(false);
    setTransactionId('');
    setPaymentProof(null);
    setSuccess(null);
  };

  const amountValue = parseFloat(amount) || 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center space-x-2 mb-6">
        <CreditCard className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-semibold">Deposit Funds</h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      {!showBankDetails ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Deposit Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min={limits.minDeposit}
            max={limits.maxDeposit}
            step="0.01"
            disabled={isLoading}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Payment Method</label>
            <div className="space-y-2">
              {paymentMethods.filter(m => m.available).map((method) => (
                <label 
                  key={method.id} 
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedMethod?.id === method.id 
                      ? 'bg-blue-600/20 border-2 border-blue-500' 
                      : 'bg-slate-700 border-2 border-transparent hover:bg-slate-600'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={method.id}
                    checked={selectedMethod?.id === method.id}
                    onChange={() => setSelectedMethod(method)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className="text-2xl mr-3">{method.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{method.name}</span>
                      <span className="text-sm text-slate-400">{method.processingTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Manual verification required</span>
                      <span>Limit: {formatCurrency(method.minAmount)} - {formatCurrency(method.maxAmount)}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !selectedMethod || amountValue < limits.minDeposit || amountValue > limits.maxDeposit}
          >
            Continue to Payment Details
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Bank Details */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4 text-green-400">Bank Transfer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">Bank Name</p>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.bankName, 'bankName')}
                  >
                    {copiedField === 'bankName' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">Account Name</p>
                    <p className="font-medium">{bankDetails.accountName}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                  >
                    {copiedField === 'accountName' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">Account Number</p>
                    <p className="font-medium">{bankDetails.accountNumber}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
                  >
                    {copiedField === 'accountNumber' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">Routing Number</p>
                    <p className="font-medium">{bankDetails.routingNumber}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.routingNumber!, 'routingNumber')}
                  >
                    {copiedField === 'routingNumber' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">SWIFT Code</p>
                    <p className="font-medium">{bankDetails.swiftCode}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.swiftCode!, 'swiftCode')}
                  >
                    {copiedField === 'swiftCode' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border-2 border-yellow-500/50">
                  <div>
                    <p className="text-xs text-yellow-400">Reference (REQUIRED)</p>
                    <p className="font-bold text-yellow-300">{bankDetails.reference}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(bankDetails.reference, 'reference')}
                  >
                    {copiedField === 'reference' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300 font-medium mb-2">Important Instructions:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Transfer exactly <strong>{formatCurrency(amountValue)}</strong> to the above account</li>
                <li>• Include the reference code <strong>{bankDetails.reference}</strong> in your transfer</li>
                <li>• Take a screenshot of your successful transaction</li>
                <li>• Upload the screenshot and enter your transaction ID below</li>
              </ul>
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Transaction ID <span className="text-red-400">*</span>
              </label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your bank transaction ID"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Screenshot <span className="text-red-400">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                {paymentProof ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-medium">File uploaded successfully</span>
                    </div>
                    <p className="text-sm text-slate-300">{paymentProof.name}</p>
                    <p className="text-xs text-slate-400">
                      Size: {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPaymentProof(null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-slate-300 font-medium">Upload Payment Screenshot</p>
                      <p className="text-sm text-slate-400">PNG, JPG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      id="payment-proof"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      disabled={isLoading}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToForm}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handlePaymentSubmission}
              disabled={isLoading || !transactionId.trim() || !paymentProof}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Payment Proof'
              )}
            </Button>
          </div>

          {/* Processing Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">Verification Process</h4>
                <p className="text-sm text-slate-300">
                  Your deposit will be reviewed by our team within 24 hours. You'll receive a notification 
                  once your payment is verified and funds are credited to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <h4 className="font-medium mb-2">Deposit Limits</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
          <div>
            <span>Daily Limit:</span>
            <span className="float-right">{formatCurrency(limits.dailyDepositLimit)}</span>
          </div>
          <div>
            <span>Monthly Limit:</span>
            <span className="float-right">{formatCurrency(limits.monthlyDepositLimit)}</span>
          </div>
          <div>
            <span>Min Deposit:</span>
            <span className="float-right">{formatCurrency(limits.minDeposit)}</span>
          </div>
          <div>
            <span>Max Deposit:</span>
            <span className="float-right">{formatCurrency(limits.maxDeposit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}