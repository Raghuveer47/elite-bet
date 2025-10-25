import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, 
  CheckCircle, XCircle, Clock, AlertTriangle, Eye, 
  Search, RefreshCw, Database, Copy, Check
} from 'lucide-react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function FinancialManagement() {
  const { 
    pendingPayments,
    approveDeposit,
    rejectDeposit,
    refreshLocalTransactions,
    isLoading 
  } = useAdmin();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Enhanced filtering
  const filteredPayments = pendingPayments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesType = filterType === 'all' || payment.type === filterType;
    const matchesSearch = searchTerm === '' || 
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customerName && payment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.email && payment.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.bankTransactionId && payment.bankTransactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.upiId && payment.upiId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessingPayment(paymentId);
      await approveDeposit(paymentId);
      toast.success('Deposit approved successfully!');
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve deposit');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      setProcessingPayment(paymentId);
      await rejectDeposit(paymentId, 'Rejected by admin');
      toast.success('Deposit rejected');
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject deposit');
    } finally {
      setProcessingPayment(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
      approved: { color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
      rejected: { color: 'text-red-400 bg-red-400/10', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
          <p className="text-slate-400 mt-1">Review and approve pending deposits and withdrawals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshLocalTransactions}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Local
          </Button>
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Pending</p>
              <p className="text-2xl font-bold text-white">{pendingPayments.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Deposits</p>
              <p className="text-2xl font-bold text-white">
                {pendingPayments.filter(p => p.type === 'deposit').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Withdrawals</p>
              <p className="text-2xl font-bold text-white">
                {pendingPayments.filter(p => p.type === 'withdrawal').length}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by transaction ID, reference, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setFilterType('all');
          }}>
            <XCircle className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Pending Payments List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Pending Payments ({filteredPayments.length})</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
            <p className="ml-3 text-slate-400">Loading pending payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Clock className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
            <p className="text-sm">All payments have been processed</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(payment.status)}
                      <h3 className="text-lg font-semibold text-white">
                        {payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Request
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm">Amount</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(payment.amount)} {payment.currency}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">Transaction ID</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-mono text-sm">{payment.transactionId}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(payment.transactionId, `txn_${payment.id}`)}
                            className="p-1 h-auto"
                          >
                            {copiedField === `txn_${payment.id}` ? 
                              <Check className="w-3 h-3 text-green-400" /> : 
                              <Copy className="w-3 h-3 text-slate-400" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">Reference</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-mono text-sm">{payment.reference}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(payment.reference, `ref_${payment.id}`)}
                            className="p-1 h-auto"
                          >
                            {copiedField === `ref_${payment.id}` ? 
                              <Check className="w-3 h-3 text-green-400" /> : 
                              <Copy className="w-3 h-3 text-slate-400" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">User ID</p>
                        <p className="text-white font-mono text-sm">{payment.userId}</p>
                      </div>
                      
                      {payment.customerName && (
                        <div>
                          <p className="text-slate-400 text-sm">Customer Name</p>
                          <p className="text-white font-medium">{payment.customerName}</p>
                        </div>
                      )}
                      
                      {payment.email && (
                        <div>
                          <p className="text-slate-400 text-sm">Email</p>
                          <p className="text-white">{payment.email}</p>
                        </div>
                      )}
                      
                      {payment.phoneNumber && (
                        <div>
                          <p className="text-slate-400 text-sm">Phone</p>
                          <p className="text-white">{payment.phoneNumber}</p>
                        </div>
                      )}
                      
                      {payment.upiId && (
                        <div>
                          <p className="text-slate-400 text-sm">UPI ID</p>
                          <p className="text-white font-mono">{payment.upiId}</p>
                        </div>
                      )}
                      
                      {payment.bankTransactionId && (
                        <div>
                          <p className="text-slate-400 text-sm">Bank Transaction ID</p>
                          <p className="text-white font-mono">{payment.bankTransactionId}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-slate-400 text-sm">Method</p>
                        <p className="text-white capitalize">{payment.method}</p>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">Submitted</p>
                        <p className="text-white">{formatDate(payment.submittedAt)}</p>
                      </div>
                    </div>
                    
                    {payment.paymentProofUrl && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm mb-2">Payment Proof</p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImageClick(payment.paymentProofUrl)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Screenshot
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(payment.paymentProofUrl, `proof_${payment.id}`)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {payment.bankDetails && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <p className="text-blue-300 text-sm font-medium mb-2">Bank Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-blue-400">Bank:</span>
                            <span className="text-white ml-1">{payment.bankDetails.bankName}</span>
                          </div>
                          <div>
                            <span className="text-blue-400">Account:</span>
                            <span className="text-white ml-1">{payment.bankDetails.accountName}</span>
                          </div>
                          <div>
                            <span className="text-blue-400">Number:</span>
                            <span className="text-white ml-1 font-mono">{payment.bankDetails.accountNumber}</span>
                          </div>
                          {payment.bankDetails.ifscCode && payment.bankDetails.ifscCode !== 'N/A' && (
                            <div>
                              <span className="text-blue-400">IFSC:</span>
                              <span className="text-white ml-1 font-mono">{payment.bankDetails.ifscCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {payment.status === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        onClick={() => handleApprove(payment.id)}
                        disabled={processingPayment === payment.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingPayment === payment.id ? (
                          <LoadingSpinner />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleReject(payment.id)}
                        disabled={processingPayment === payment.id}
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment Proof</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <img
              src={selectedImage}
              alt="Payment proof"
              className="max-w-full max-h-[70vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}