import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { PendingPayment } from '../../types/wallet';
import { formatCurrency, formatDate } from '../../lib/utils';

export function PendingDepositsManager() {
  const { pendingPayments, isLoading, approveDeposit, rejectDeposit } = useAdmin();
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingDeposits = pendingPayments.filter(payment => 
    payment.type === 'deposit' && payment.status === 'pending'
  );

  const handleApprove = async (paymentId: string) => {
    try {
      await approveDeposit(paymentId);
      toast.success('Deposit approved successfully!');
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Failed to approve deposit');
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectDeposit(paymentId, rejectionReason);
      toast.success('Deposit rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Failed to reject deposit');
    }
  };

  const openImageModal = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowImageModal(true);
  };

  const openRejectModal = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowRejectModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Pending Deposits</h3>
        <div className="text-sm text-slate-400">
          {pendingDeposits.length} pending deposits
        </div>
      </div>

      {pendingDeposits.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No pending deposits</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDeposits.map((payment) => (
            <div key={payment.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-semibold">
                      {payment.userId.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">User {payment.userId.slice(0, 8)}...</p>
                    <p className="text-sm text-slate-400">
                      Submitted {formatDate(payment.submittedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-400">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-sm text-slate-400">{payment.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-400">Payment Method</p>
                  <p className="font-medium">{payment.method}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Transaction ID</p>
                  <p className="font-medium font-mono text-sm">{payment.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                </div>
              </div>

              {payment.bankDetails && (
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Bank:</span>
                      <span className="ml-2">{payment.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Account:</span>
                      <span className="ml-2">{payment.bankDetails.accountNumber}</span>
                    </div>
                    {payment.bankDetails.ifscCode && (
                      <div>
                        <span className="text-slate-400">IFSC:</span>
                        <span className="ml-2">{payment.bankDetails.ifscCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openImageModal(payment)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Screenshot
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRejectModal(payment)}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(payment.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payment Screenshot</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Transaction Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="ml-2 font-mono">{selectedPayment.transactionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Method:</span>
                      <span className="ml-2">{selectedPayment.method}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Submitted:</span>
                      <span className="ml-2">{formatDate(selectedPayment.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <img
                    src={selectedPayment.paymentProofUrl}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg border border-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold">Reject Deposit</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                  <p className="text-sm text-slate-400 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedPayment.transactionId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rejection Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-red-500"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedPayment.id)}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Reject Deposit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
