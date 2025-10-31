import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, 
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
    transactions,
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
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get all payment transactions (deposits and withdrawals)
  const allPaymentTransactions = transactions.filter(t => 
    t.type === 'deposit' || t.type === 'withdrawal'
  );

  // Enhanced filtering - now works on all transactions
  const displayedTransactions = (showAllTransactions ? allPaymentTransactions : pendingPayments).filter(payment => {
    // Convert status for filtering
    let paymentStatus = 'pending';
    
    // Handle transaction status - check if it's a PendingPayment
    const isPendingPayment = 'transactionId' in payment && payment.transactionId !== undefined;
    const txStatus = payment.status;
    
    if (txStatus === 'completed') {
      paymentStatus = 'approved';
    } else if (txStatus === 'failed' || txStatus === 'rejected') {
      paymentStatus = 'rejected';
    } else {
      paymentStatus = 'pending';
    }
    
    const matchesStatus = filterStatus === 'all' || paymentStatus === filterStatus;
    const matchesType = filterType === 'all' || payment.type === filterType;
    
    const searchTarget = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      payment.id?.toLowerCase().includes(searchTarget) ||
      (isPendingPayment && payment.transactionId?.toLowerCase().includes(searchTarget)) ||
      payment.reference?.toLowerCase().includes(searchTarget) ||
      payment.userId?.toLowerCase().includes(searchTarget) ||
      (isPendingPayment && payment.customerName?.toLowerCase().includes(searchTarget)) ||
      (isPendingPayment && payment.email?.toLowerCase().includes(searchTarget)) ||
      (isPendingPayment && payment.bankTransactionId?.toLowerCase().includes(searchTarget)) ||
      (isPendingPayment && payment.upiId?.toLowerCase().includes(searchTarget));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(displayedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = displayedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchTerm, showAllTransactions]);

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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Pending</p>
              <p className="text-2xl font-bold text-white">{pendingPayments.length}</p>
              <p className="text-xs text-slate-500 mt-1">Waiting for approval</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Today's Deposits</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'deposit' && 
                                t.status === 'completed' && 
                                new Date(t.createdAt).toDateString() === new Date().toDateString())
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
              <p className="text-xs text-green-400 mt-1">
                Count: {transactions.filter(t => t.type === 'deposit' && t.status === 'completed' && new Date(t.createdAt).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Deposits</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'deposit' && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                All approved deposits
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-white">
                {transactions.filter(t => t.status === 'failed').length}
              </p>
              <p className="text-xs text-red-400 mt-1">Failed transactions</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-white">
                {transactions.filter(t => t.status === 'completed' && (t.type === 'deposit' || t.type === 'withdrawal')).length}
              </p>
              <p className="text-xs text-green-400 mt-1">Completed payments</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pending only</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-xs">
          <p className="text-blue-300 mb-2">Debug Info:</p>
          <p className="text-blue-400">Total Transactions: {transactions.length}</p>
          <p className="text-blue-400">Pending Payments: {pendingPayments.length}</p>
          <p className="text-blue-400">All Payment Transactions: {allPaymentTransactions.length}</p>
          <p className="text-blue-400">Displayed: {displayedTransactions.length}</p>
          <p className="text-blue-400">Show All: {showAllTransactions ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <option value="approved">✓ Approved</option>
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
          
          <Button 
            variant={showAllTransactions ? "primary" : "outline"} 
            size="sm" 
            onClick={() => setShowAllTransactions(!showAllTransactions)}
          >
            <Database className="w-4 h-4 mr-2" />
            {showAllTransactions ? 'Show Pending Only' : 'Show All Transactions'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setFilterType('all');
            setShowAllTransactions(false);
            setCurrentPage(1);
          }}>
            <XCircle className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {showAllTransactions ? 'All Transactions' : 'Pending Payments'} ({displayedTransactions.length})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
            <p className="ml-3 text-slate-400">Loading transactions...</p>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Clock className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-sm">
              {filterStatus !== 'all' || filterType !== 'all' || searchTerm ? 
                'Try adjusting your filters' : 
                showAllTransactions ? 'No transactions to display' : 'All payments have been processed'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {paginatedTransactions.map((payment) => {
              // Determine payment status for display
              let paymentStatus: 'pending' | 'approved' | 'rejected' = 'pending';
              
              // Type guard: check if payment has status
              if ('status' in payment && payment.status) {
                const txStatus = payment.status as string;
                if (txStatus === 'completed') {
                  paymentStatus = 'approved';
                } else if (txStatus === 'failed') {
                  paymentStatus = 'rejected';
                } else {
                  paymentStatus = 'pending';
                }
              }
              
              return (
              <div key={payment.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(paymentStatus)}
                      <h3 className="text-lg font-semibold text-white">
                        {payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Request
                      </h3>
                      {getStatusBadge(paymentStatus)}
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
                          <p className="text-white font-mono text-sm">
                            {('transactionId' in payment ? payment.transactionId : null) || payment.id}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(('transactionId' in payment ? payment.transactionId : null) || payment.id, `txn_${payment.id}`)}
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
                          <p className="text-white font-mono text-sm">{payment.reference || 'N/A'}</p>
                          {payment.reference && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(payment.reference || '', `ref_${payment.id}`)}
                              className="p-1 h-auto"
                            >
                              {copiedField === `ref_${payment.id}` ? 
                                <Check className="w-3 h-3 text-green-400" /> : 
                                <Copy className="w-3 h-3 text-slate-400" />
                              }
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">User ID</p>
                        <p className="text-white font-mono text-sm">{payment.userId || 'N/A'}</p>
                      </div>
                      
                      {('customerName' in payment && payment.customerName) && (
                        <div>
                          <p className="text-slate-400 text-sm">Customer Name</p>
                          <p className="text-white font-medium">{payment.customerName}</p>
                        </div>
                      )}
                      
                      {('email' in payment && payment.email) && (
                        <div>
                          <p className="text-slate-400 text-sm">Email</p>
                          <p className="text-white">{payment.email}</p>
                        </div>
                      )}
                      
                      {('phoneNumber' in payment && payment.phoneNumber) && (
                        <div>
                          <p className="text-slate-400 text-sm">Phone</p>
                          <p className="text-white">{payment.phoneNumber}</p>
                        </div>
                      )}
                      
                      {('upiId' in payment && payment.upiId) && (
                        <div>
                          <p className="text-slate-400 text-sm">UPI ID</p>
                          <p className="text-white font-mono">{payment.upiId}</p>
                        </div>
                      )}
                      
                      {('bankTransactionId' in payment && payment.bankTransactionId) && (
                        <div>
                          <p className="text-slate-400 text-sm">Bank Transaction ID</p>
                          <p className="text-white font-mono">{payment.bankTransactionId}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-slate-400 text-sm">Method</p>
                        <p className="text-white capitalize">
                          {('method' in payment && payment.method) || (payment.type === 'deposit' ? 'Bank Transfer' : 'Withdrawal')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-slate-400 text-sm">Submitted</p>
                        <p className="text-white">
                          {formatDate(('submittedAt' in payment ? payment.submittedAt : payment.createdAt) || new Date())}
                        </p>
                      </div>
                    </div>
                    
                    {('paymentProofUrl' in payment && payment.paymentProofUrl) && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm mb-2">Payment Proof</p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImageClick(payment.paymentProofUrl as string)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Screenshot
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(payment.paymentProofUrl as string, `proof_${payment.id}`)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {('bankDetails' in payment && payment.bankDetails) && (
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
                  
                  {paymentStatus === 'pending' && (
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
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {startIndex + 1} to {Math.min(endIndex, displayedTransactions.length)} of {displayedTransactions.length} transactions
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[2.5rem]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
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