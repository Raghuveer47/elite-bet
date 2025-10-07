import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Download, 
  CheckCircle, XCircle, Clock, AlertTriangle, Eye, Image, FileText,
  Filter, Search, BarChart3, Users, Activity, Upload, Copy, Check
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataStorage } from '../../utils/dataStorage';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function FinancialManagement() {
  const { 
    systemStats, 
    users,
    getAllTransactions,
    pendingPayments,
    approvePendingPayment,
    rejectPendingPayment,
    investigatePendingPayment,
    generateReport,
    financialReports,
    isLoading 
  } = useAdmin();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'investigate'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [adminProofFile, setAdminProofFile] = useState<File | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const allTransactions = getAllTransactions();
  const pendingWithdrawals = allTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
  
  // Enhanced filtering
  const filteredPayments = pendingPayments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesType = filterType === 'all' || payment.type === filterType;
    const matchesSearch = searchTerm === '' || 
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users.find(u => u.id === payment.userId)?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Debug logging for payment visibility
  useEffect(() => {
    console.log('FinancialManagement: Current pending payments:', pendingPayments.length);
    console.log('FinancialManagement: Pending payments data:', pendingPayments);
    
    // Force refresh data from storage on mount and periodically
    const refreshData = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const storedData = DataStorage.loadData();
      console.log('FinancialManagement: Refreshing from storage:', {
        transactions: storedData.transactions?.length || 0,
        pendingPayments: storedData.pendingPayments?.length || 0
      });
    };
    
    refreshData();
    
    // Set up interval to check for new data
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [pendingPayments]);

  const handlePaymentAction = async () => {
    if (!selectedPayment) return;
    
    try {
      let adminProofUrl = '';
      
      // For approvals, convert uploaded file to base64 if provided
      if (actionType === 'approve' && adminProofFile) {
        adminProofUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(adminProofFile);
        });
      }
      
      switch (actionType) {
        case 'approve':
          await approvePendingPayment(selectedPayment, actionReason, adminProofUrl);
          break;
        case 'reject':
          if (!actionReason) {
            alert('Rejection reason is required');
            return;
          }
          await rejectPendingPayment(selectedPayment, actionReason);
          break;
        case 'investigate':
          if (!actionReason) {
            alert('Investigation notes are required');
            return;
          }
          await investigatePendingPayment(selectedPayment, actionReason);
          break;
      }
      
      setShowActionModal(false);
      setActionReason('');
      setAdminProofFile(null);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to process payment action:', error);
    }
  };

  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setAdminProofFile(file);
  };

  const handleGenerateReport = async () => {
    try {
      await generateReport(selectedPeriod);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const openImageModal = (imageUrl: string) => {
    if (!imageUrl || imageUrl.trim() === '') {
      alert('No payment proof available');
      return;
    }
    console.log('Opening image modal with URL:', imageUrl);
    setSelectedImage(imageUrl);
    setShowImageModal(true);
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

  const getPaymentUser = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'approved': return 'text-green-400 bg-green-500/10';
      case 'rejected': return 'text-red-400 bg-red-500/10';
      case 'investigating': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const financialMetrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(systemStats.platformRevenue),
      icon: DollarSign,
      color: 'text-green-400',
      change: '+12.5%',
      bgColor: 'bg-slate-800'
    },
    {
      title: 'Gross Gaming Revenue',
      value: formatCurrency(systemStats.totalBets - systemStats.totalWinnings),
      icon: TrendingUp,
      color: 'text-blue-400',
      change: '+8.3%',
      bgColor: 'bg-slate-800'
    },
    {
      title: 'Pending Payments',
      value: pendingPayments.length.toString(),
      icon: Clock,
      color: 'text-yellow-400',
      change: pendingPayments.length > 5 ? 'High' : 'Normal',
      bgColor: 'bg-slate-800'
    },
    {
      title: 'Net Deposits',
      value: formatCurrency(systemStats.totalDeposits - systemStats.totalWithdrawals),
      icon: TrendingDown,
      color: 'text-purple-400',
      change: '+15.7%',
      bgColor: 'bg-slate-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Management</h1>
          <p className="text-slate-400">Monitor and manage platform finances</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700 rounded-lg">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Live Processing</span>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialMetrics.map((metric, index) => (
          <div key={index} className={`${metric.bgColor} rounded-xl p-6 border border-slate-700 relative overflow-hidden hover:scale-105 transition-all duration-300 group cursor-pointer`}>
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
              <metric.icon className="w-full h-full group-hover:opacity-20 transition-opacity" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className={`w-8 h-8 ${metric.color} group-hover:scale-110 transition-transform`} />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  metric.change.includes('+') ? 'bg-green-500/20 text-green-400' :
                  metric.change.includes('-') ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{metric.value}</h3>
              <p className="text-slate-400 text-sm">{metric.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white">Live Payment Processing Center</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">Real-time</span>
            </div>
            <span className="text-sm text-slate-400">
              Showing {filteredPayments.length} of {pendingPayments.length} payments
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by transaction ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="investigating">Investigating</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
          </select>
          
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold text-white">Payment Verification Queue</h3>
          <div className="flex items-center space-x-4 mt-2">
            <span className="bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold">
              {pendingPayments.filter(p => p.status === 'pending').length} pending review
            </span>
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
              {pendingPayments.filter(p => p.status === 'investigating').length} investigating
            </span>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 px-6">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No payments match your filters</p>
            <p className="text-slate-500 text-sm">All payments have been processed</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredPayments.map(payment => {
              const user = getPaymentUser(payment.userId);
              return (
                <div key={payment.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Payment Info */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          payment.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {payment.type.toUpperCase()}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-slate-400 mb-2">{payment.method}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          Submitted: {formatDate(payment.submittedAt)}
                        </p>
                        {payment.reviewedAt && (
                          <p className="text-xs text-slate-500">
                            Reviewed: {formatDate(payment.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div>
                      <h5 className="text-sm font-medium text-white mb-3">User Information</h5>
                      {user ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Balance:</p>
                              <p className="text-green-400 font-bold">{formatCurrency(user.balance)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Status:</p>
                              <p className={`font-bold ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                                {user.isVerified ? 'Verified' : 'Unverified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Risk:</p>
                              <p className={`font-bold ${
                                user.riskLevel === 'high' ? 'text-red-400' :
                                user.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {user.riskLevel}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Country:</p>
                              <p className="text-white font-bold">{user.country}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-400 text-sm">User not found</p>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div>
                      <h5 className="text-sm font-medium text-white mb-3">Transaction Details</h5>
                      <div className="space-y-3">
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-400">Transaction ID</p>
                              <p className="text-sm font-mono text-white">{payment.transactionId}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(payment.transactionId, 'transactionId')}
                            >
                              {copiedField === 'transactionId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Currency:</p>
                            <p className="text-white font-bold">{payment.currency}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Method:</p>
                            <p className="text-white font-bold">{payment.method}</p>
                          </div>
                        </div>
                        
                        {payment.reviewedBy && (
                          <p className="text-xs text-blue-400">
                            Reviewed by: {payment.reviewedBy}
                          </p>
                        )}
                        {payment.rejectionReason && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                            <p className="text-xs text-red-400 font-medium">Rejection Reason:</p>
                            <p className="text-xs text-slate-300">{payment.rejectionReason}</p>
                          </div>
                        )}
                        {payment.adminNotes && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                            <p className="text-xs text-blue-400 font-medium">Admin Notes:</p>
                            <p className="text-xs text-slate-300">{payment.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank Details (for withdrawals) */}
                    {payment.type === 'withdraw' && payment.bankDetails && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-3">Bank Details</h5>
                        <div className="bg-slate-700 rounded-lg p-3 space-y-2">
                          <div className="text-xs">
                            <p className="text-slate-400">Bank:</p>
                            <p className="text-white font-medium">{payment.bankDetails.bankName}</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-400">Account:</p>
                            <p className="text-white font-medium">{payment.bankDetails.accountName}</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-400">Number:</p>
                            <p className="text-white font-mono">{payment.bankDetails.accountNumber}</p>
                          </div>
                          {payment.bankDetails.routingNumber && (
                            <div className="text-xs">
                              <p className="text-slate-400">Routing:</p>
                              <p className="text-white font-mono">{payment.bankDetails.routingNumber}</p>
                            </div>
                          )}
                          {payment.bankDetails.reference && (
                            <div className="text-xs">
                              <p className="text-slate-400">Reference:</p>
                              <p className="text-yellow-400 font-bold">{payment.bankDetails.reference}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openImageModal(payment.paymentProofUrl)}
                      className="flex items-center space-x-2"
                      disabled={!payment.paymentProofUrl || payment.paymentProofUrl.trim() === ''}
                    >
                      {payment.paymentProofUrl && payment.paymentProofUrl.trim() !== '' ? (
                        <>
                          <Image className="w-4 h-4" />
                          <span>View User Proof</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>No Proof Available</span>
                        </>
                      )}
                    </Button>
                    
                    {payment.status === 'pending' && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('approve');
                            setShowActionModal(true);
                          }}
                          disabled={isLoading}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('investigate');
                            setShowActionModal(true);
                          }}
                          disabled={isLoading}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Investigate</span>
                        </Button>
                        
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('reject');
                            setShowActionModal(true);
                          }}
                          disabled={isLoading}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}
                    
                    {payment.status === 'investigating' && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('approve');
                            setShowActionModal(true);
                          }}
                          disabled={isLoading}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </Button>
                        
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment.id);
                            setActionType('reject');
                            setShowActionModal(true);
                          }}
                          disabled={isLoading}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}
                    
                    {payment.status === 'approved' && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Approved by {payment.reviewedBy}</span>
                      </div>
                    )}
                    
                    {payment.status === 'rejected' && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Rejected by {payment.reviewedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Summary */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Today's Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Deposits Processed</p>
                  <p className="text-xs text-slate-400">
                    {allTransactions.filter(t => 
                      t.type === 'deposit' && 
                      t.status === 'completed' && 
                      new Date(t.createdAt).toDateString() === new Date().toDateString()
                    ).length} transactions
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(allTransactions
                  .filter(t => 
                    t.type === 'deposit' && 
                    t.status === 'completed' && 
                    new Date(t.createdAt).toDateString() === new Date().toDateString()
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Withdrawals Processed</p>
                  <p className="text-xs text-slate-400">
                    {allTransactions.filter(t => 
                      t.type === 'withdraw' && 
                      t.status === 'completed' && 
                      new Date(t.createdAt).toDateString() === new Date().toDateString()
                    ).length} transactions
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-red-400">
                {formatCurrency(Math.abs(allTransactions
                  .filter(t => 
                    t.type === 'withdraw' && 
                    t.status === 'completed' && 
                    new Date(t.createdAt).toDateString() === new Date().toDateString()
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
                ))}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="font-medium text-blue-400">Net Flow</p>
                  <p className="text-xs text-slate-400">Deposits - Withdrawals</p>
                </div>
              </div>
              <p className="text-xl font-bold text-blue-400">
                {formatCurrency(
                  allTransactions
                    .filter(t => 
                      (t.type === 'deposit' || t.type === 'withdraw') && 
                      t.status === 'completed' && 
                      new Date(t.createdAt).toDateString() === new Date().toDateString()
                    )
                    .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : t.amount), 0)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Queue Status */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Processing Queue Status</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-400">
                  {pendingPayments.filter(p => p.status === 'pending').length}
                </p>
                <p className="text-yellow-300 text-sm">Pending Review</p>
              </div>
              
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">
                  {pendingPayments.filter(p => p.status === 'investigating').length}
                </p>
                <p className="text-blue-300 text-sm">Under Investigation</p>
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Average Processing Times</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Deposits:</p>
                  <p className="text-green-400 font-bold">2.3 hours</p>
                </div>
                <div>
                  <p className="text-slate-400">Withdrawals:</p>
                  <p className="text-blue-400 font-bold">4.7 hours</p>
                </div>
                <div>
                  <p className="text-slate-400">KYC Reviews:</p>
                  <p className="text-purple-400 font-bold">18.5 hours</p>
                </div>
                <div>
                  <p className="text-slate-400">Support Tickets:</p>
                  <p className="text-orange-400 font-bold">1.2 hours</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-400">SLA Compliance</p>
                  <p className="text-xs text-slate-400">24-hour processing target</p>
                </div>
                <p className="text-2xl font-bold text-green-400">98.7%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Reports */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6">Financial Reports</h3>
        
        {financialReports.length === 0 ? (
          <div className="text-center py-8">
            <Download className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No reports generated yet</p>
            <Button variant="outline" className="mt-4" onClick={handleGenerateReport}>
              Generate First Report
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {financialReports.map((report, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{report.period}</h4>
                    <p className="text-sm text-slate-400">
                      Revenue: {formatCurrency(report.totalRevenue)} | 
                      Profit: {formatCurrency(report.netProfit)} |
                      Users: {report.activeUsers}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {actionType === 'approve' ? '✅ Approve Payment' : 
                 actionType === 'reject' ? '❌ Reject Payment' : '🔍 Investigate Payment'}
              </h3>
              <Button variant="ghost" onClick={() => setShowActionModal(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Payment Summary */}
            {selectedPayment && (
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-white mb-3">Payment Summary</h4>
                {(() => {
                  const payment = pendingPayments.find(p => p.id === selectedPayment);
                  const user = payment ? getPaymentUser(payment.userId) : null;
                  
                  return payment ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Amount:</p>
                        <p className="text-white font-bold">{formatCurrency(payment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Type:</p>
                        <p className="text-white font-bold capitalize">{payment.type}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">User:</p>
                        <p className="text-white font-bold">
                          {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Method:</p>
                        <p className="text-white font-bold">{payment.method}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            
            <div className="space-y-4">
              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {(() => {
                      const payment = pendingPayments.find(p => p.id === selectedPayment);
                      return payment?.type === 'withdraw' 
                        ? 'Upload Payment Proof (Required for withdrawals)' 
                        : 'Upload Payment Proof (Optional for deposits)';
                    })()}
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
                    {adminProofFile ? (
                      <div className="text-center space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                        <p className="text-green-400 font-medium">{adminProofFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(adminProofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setAdminProofFile(null)}>
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-slate-300">Upload payment confirmation</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAdminFileUpload}
                          className="hidden"
                          id="admin-proof-upload"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('admin-proof-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <Input
                label={
                  actionType === 'approve' ? 'Approval Notes (Optional)' :
                  actionType === 'reject' ? 'Rejection Reason (Required)' :
                  'Investigation Notes (Required)'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionType === 'approve' ? 'Add any notes about this approval...' :
                  actionType === 'reject' ? 'Provide detailed reason for rejection' :
                  'Enter investigation findings and next steps'
                }
                multiline={actionType !== 'approve'}
                rows={actionType !== 'approve' ? 3 : undefined}
              />
              
              {actionType === 'reject' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Important Notice</p>
                      <p className="text-xs text-slate-300 mt-1">
                        {(() => {
                          const payment = pendingPayments.find(p => p.id === selectedPayment);
                          return payment?.type === 'withdraw' 
                            ? 'Rejecting this withdrawal will return the funds to the user\'s account balance.'
                            : 'Rejecting this deposit will not credit any funds to the user\'s account.';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {actionType === 'investigate' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-400 font-medium">Investigation Mode</p>
                      <p className="text-xs text-slate-300 mt-1">
                        This payment will be marked for investigation. You can approve or reject it later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowActionModal(false);
                  setActionReason('');
                  setAdminProofFile(null);
                  setSelectedPayment(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant={actionType === 'reject' ? 'danger' : actionType === 'investigate' ? 'outline' : 'secondary'}
                onClick={handlePaymentAction}
                disabled={isLoading || (actionType !== 'approve' && !actionReason.trim())}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  actionType === 'approve' ? '✅ Approve Payment' :
                  actionType === 'reject' ? '❌ Reject Payment' :
                  '🔍 Mark for Investigation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-6xl w-full max-h-[95vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Payment Proof Verification</h3>
                <p className="text-sm text-slate-400">Review the submitted payment evidence</p>
              </div>
              <Button variant="ghost" onClick={() => setShowImageModal(false)}>
                <XCircle className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <img 
                src={selectedImage} 
                alt="Payment Proof" 
                className="max-w-full max-h-[70vh] rounded-lg border border-slate-600 shadow-2xl"
                onLoad={() => {
                  console.log('Image loaded successfully:', selectedImage);
                }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-400 p-8 text-center';
                  errorDiv.innerHTML = `
                    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p class="text-lg font-medium">Failed to load payment proof</p>
                    <p class="text-sm text-slate-500">The image may be corrupted or in an unsupported format</p>
                  `;
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Verification Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Transaction ID visible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Amount matches request</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Bank details correct</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Timestamp recent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">No signs of tampering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Reference code included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}