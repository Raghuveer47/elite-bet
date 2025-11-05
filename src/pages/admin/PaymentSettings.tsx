import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Edit, Trash2, Save, X, Upload, QrCode } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CloudinaryService } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';

interface PaymentConfig {
  _id?: string;
  method: string;
  isActive: boolean;
  displayName: string;
  upiId?: string;
  qrCodeUrl?: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  instructions?: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  displayOrder: number;
}

export function PaymentSettings() {
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentConfig>({
    method: '',
    isActive: true,
    displayName: '',
    upiId: '',
    qrCodeUrl: '',
    bankDetails: {},
    instructions: '',
    minAmount: 100,
    maxAmount: 100000,
    processingTime: '5-10 minutes',
    displayOrder: 0
  });

  useEffect(() => {
    loadPaymentConfigs();
  }, []);

  const loadPaymentConfigs = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/betting/admin/payment-config`);
      const data = await response.json();

      if (data.success) {
        setPaymentConfigs(data.paymentConfigs || []);
      }
    } catch (error) {
      console.error('Load payment configs error:', error);
      toast.error('Failed to load payment configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (config: PaymentConfig) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/betting/admin/payment-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment configuration saved!');
        loadPaymentConfigs();
        setEditingMethod(null);
        resetForm();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save payment config error:', error);
      toast.error('Failed to save payment configuration');
    }
  };

  const handleDelete = async (method: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/betting/admin/payment-config/${method}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment method deleted!');
        loadPaymentConfigs();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete payment config error:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const initializeDefaults = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/betting/admin/payment-config/initialize`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Default payment methods initialized!');
        loadPaymentConfigs();
      }
    } catch (error) {
      console.error('Initialize error:', error);
      toast.error('Failed to initialize');
    }
  };

  const startEdit = (config: PaymentConfig) => {
    setEditingMethod(config.method);
    setFormData(config);
  };

  const resetForm = () => {
    setFormData({
      method: '',
      isActive: true,
      displayName: '',
      upiId: '',
      qrCodeUrl: '',
      bankDetails: {},
      instructions: '',
      minAmount: 100,
      maxAmount: 100000,
      processingTime: '5-10 minutes',
      displayOrder: 0
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Settings</h1>
          <p className="text-slate-400 mt-1">Configure deposit payment methods for users</p>
        </div>
        <div className="flex gap-3">
          {paymentConfigs.length === 0 && (
            <Button onClick={initializeDefaults} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Initialize Defaults
            </Button>
          )}
          <Button onClick={() => setEditingMethod('new')} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
            </Button>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="grid gap-6">
        {paymentConfigs.map((config) => (
          <div
            key={config.method}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            {editingMethod === config.method ? (
              <PaymentConfigForm
                config={formData}
                onChange={setFormData}
                onSave={() => handleSave(formData)}
                onCancel={() => {
                  setEditingMethod(null);
                  resetForm();
                }}
              />
            ) : (
              <PaymentConfigDisplay
                config={config}
                onEdit={() => startEdit(config)}
                onDelete={() => handleDelete(config.method)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add New Form */}
      {editingMethod === 'new' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Payment Method</h3>
          <PaymentConfigForm
            config={formData}
            onChange={setFormData}
            onSave={() => handleSave(formData)}
            onCancel={() => {
              setEditingMethod(null);
              resetForm();
            }}
            isNew
          />
        </div>
      )}
    </div>
  );
}

// Display Component
function PaymentConfigDisplay({
  config,
  onEdit,
  onDelete
}: {
  config: PaymentConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            config.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{config.displayName}</h3>
            <p className="text-sm text-slate-400">{config.method}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-400">Status</p>
          <p className="text-white">{config.isActive ? 'Active' : 'Inactive'}</p>
        </div>
        <div>
          <p className="text-slate-400">Processing Time</p>
          <p className="text-white">{config.processingTime}</p>
        </div>
        <div>
          <p className="text-slate-400">Min Amount</p>
          <p className="text-white">₹{config.minAmount}</p>
        </div>
        <div>
          <p className="text-slate-400">Max Amount</p>
          <p className="text-white">₹{config.maxAmount}</p>
        </div>
      </div>

      {config.upiId && (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">UPI ID</p>
          <p className="text-white font-mono">{config.upiId}</p>
        </div>
      )}

      {config.qrCodeUrl && (
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-2">QR Code</p>
          <img
            src={config.qrCodeUrl}
            alt="QR Code"
            className="w-48 h-48 bg-white p-2 rounded-lg"
          />
        </div>
      )}

      {config.bankDetails?.accountNumber && (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-white">Bank Details</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-slate-400">Account Holder:</p>
            <p className="text-white">{config.bankDetails.accountHolderName}</p>
            <p className="text-slate-400">Account Number:</p>
            <p className="text-white font-mono">{config.bankDetails.accountNumber}</p>
            <p className="text-slate-400">IFSC Code:</p>
            <p className="text-white font-mono">{config.bankDetails.ifscCode}</p>
            <p className="text-slate-400">Bank Name:</p>
            <p className="text-white">{config.bankDetails.bankName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Form Component
function PaymentConfigForm({
  config,
  onChange,
  onSave,
  onCancel,
  isNew = false
}: {
  config: PaymentConfig;
  onChange: (config: PaymentConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const isPhonePe = config.method === 'phonepe' || config.method === 'upi';
  const isBankTransfer = config.method === 'bank_transfer';
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    try {
      setUploadingQR(true);
      toast.loading('Uploading QR code to Cloudinary...');

      const uploadResult = await CloudinaryService.uploadImage(file, 'elite-bet/qr-codes');
      
      toast.dismiss();
      toast.success('QR code uploaded successfully!');
      
      onChange({ ...config, qrCodeUrl: uploadResult.url });
    } catch (error) {
      console.error('QR upload error:', error);
      toast.dismiss();
      toast.error('Failed to upload QR code');
    } finally {
      setUploadingQR(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Payment Method *
          </label>
          <select
            value={config.method}
            onChange={(e) => onChange({ ...config, method: e.target.value })}
            disabled={!isNew}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Select Method</option>
            <option value="phonepe">UPI (PhonePe/GPay/Paytm)</option>
            <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={config.displayName}
            onChange={(e) => onChange({ ...config, displayName: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
            placeholder="PhonePe / UPI"
          />
        </div>
      </div>

      {/* UPI/PhonePe Fields */}
      {isPhonePe && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              UPI ID
            </label>
            <input
              type="text"
              value={config.upiId || ''}
              onChange={(e) => onChange({ ...config, upiId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white font-mono"
              placeholder="merchant@paytm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              QR Code
            </label>
            
            {/* QR Code Preview */}
            {config.qrCodeUrl && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={config.qrCodeUrl}
                    alt="QR Code Preview"
                    className="w-48 h-48 bg-white p-2 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, qrCodeUrl: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Upload Button */}
            <input
              ref={qrFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => qrFileInputRef.current?.click()}
              variant="outline"
              disabled={uploadingQR}
              icon={uploadingQR ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
            >
              {uploadingQR ? 'Uploading...' : config.qrCodeUrl ? 'Change QR Code' : 'Upload QR Code'}
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              {config.qrCodeUrl 
                ? '✅ QR code uploaded to Cloudinary'
                : 'Click to upload QR code image (automatically uploads to Cloudinary)'}
            </p>
          </div>
        </div>
      )}

      {/* Bank Transfer Fields */}
      {isBankTransfer && (
        <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg">
          <p className="text-sm font-semibold text-white">Bank Account Details</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={config.bankDetails?.accountHolderName || ''}
                onChange={(e) => onChange({
                  ...config,
                  bankDetails: { ...config.bankDetails, accountHolderName: e.target.value }
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Account Number</label>
              <input
                type="text"
                value={config.bankDetails?.accountNumber || ''}
                onChange={(e) => onChange({
                  ...config,
                  bankDetails: { ...config.bankDetails, accountNumber: e.target.value }
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">IFSC Code</label>
              <input
                type="text"
                value={config.bankDetails?.ifscCode || ''}
                onChange={(e) => onChange({
                  ...config,
                  bankDetails: { ...config.bankDetails, ifscCode: e.target.value }
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={config.bankDetails?.bankName || ''}
                onChange={(e) => onChange({
                  ...config,
                  bankDetails: { ...config.bankDetails, bankName: e.target.value }
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Branch Name</label>
              <input
                type="text"
                value={config.bankDetails?.branchName || ''}
                onChange={(e) => onChange({
                  ...config,
                  bankDetails: { ...config.bankDetails, branchName: e.target.value }
                })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Common Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Min Amount (₹)
          </label>
          <input
            type="number"
            value={config.minAmount}
            onChange={(e) => onChange({ ...config, minAmount: Number(e.target.value) })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Max Amount (₹)
          </label>
          <input
            type="number"
            value={config.maxAmount}
            onChange={(e) => onChange({ ...config, maxAmount: Number(e.target.value) })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Processing Time
          </label>
          <input
            type="text"
            value={config.processingTime}
            onChange={(e) => onChange({ ...config, processingTime: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
            placeholder="5-10 minutes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => onChange({ ...config, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600"
            />
            <span className="text-white">{config.isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Instructions for Users
        </label>
        <textarea
          value={config.instructions || ''}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
          rows={4}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
          placeholder="Step-by-step instructions..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
        <Button onClick={onCancel} variant="ghost">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave} variant="primary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

