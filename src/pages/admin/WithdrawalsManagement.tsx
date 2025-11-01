import { useMemo, useState } from 'react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { Eye, X } from 'lucide-react';

export function WithdrawalsManagement() {
  const { pendingPayments, approveWithdrawal, rejectWithdrawal, refreshData, isLoading } = useAdmin() as any;
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  const withdrawals = useMemo(() => pendingPayments.filter((p: any) => p.type === 'withdrawal' && p.status === 'pending'), [pendingPayments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pending Withdrawals</h1>
        <Button variant="outline" onClick={refreshData} disabled={isLoading}>Refresh</Button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-700/50 text-slate-300">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Bank Details</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>No pending withdrawals.</td>
              </tr>
            )}
            {withdrawals.map((w: any) => (
              <tr key={w.id} className="border-t border-slate-700 text-slate-200">
                <td className="px-4 py-3">{w.userId}</td>
                <td className="px-4 py-3 text-green-400 font-bold">{formatCurrency(w.amount, w.currency || 'INR')}</td>
                <td className="px-4 py-3">{w.currency || 'INR'}</td>
                <td className="px-4 py-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedWithdrawal(w)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </td>
                <td className="px-4 py-3">{new Date(w.submittedAt || w.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 space-x-2">
                  <Button onClick={() => approveWithdrawal(w.id)} className="bg-green-600 hover:bg-green-500">Approve</Button>
                  <Button variant="outline" onClick={() => rejectWithdrawal(w.id, 'Admin rejected')}>Reject</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bank Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Bank Account Details</h2>
              <button 
                onClick={() => setSelectedWithdrawal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Withdrawal Amount:</span>
                    <p className="font-bold text-green-400 text-lg mt-1">
                      {formatCurrency(selectedWithdrawal.amount, selectedWithdrawal.currency || 'INR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Reference:</span>
                    <p className="font-medium text-white mt-1">{selectedWithdrawal.reference || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedWithdrawal.metadata?.bankDetails && (
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-white border-b border-slate-600 pb-2">Bank Transfer Details</h3>
                  
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Account Holder Name</span>
                    <p className="font-medium text-white">{selectedWithdrawal.metadata.bankDetails.accountHolderName || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 uppercase">Bank Account Number</span>
                    <p className="font-mono text-white font-medium">{selectedWithdrawal.metadata.bankDetails.bankAccountNumber || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 uppercase">IFSC Code</span>
                    <p className="font-mono text-white font-medium">{selectedWithdrawal.metadata.bankDetails.ifscCode || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 uppercase">UPI ID</span>
                    <p className="font-medium text-blue-400">{selectedWithdrawal.metadata.bankDetails.upiId || '-'}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => {
                    approveWithdrawal(selectedWithdrawal.id);
                    setSelectedWithdrawal(null);
                  }} 
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  Approve Withdrawal
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    rejectWithdrawal(selectedWithdrawal.id, 'Admin rejected');
                    setSelectedWithdrawal(null);
                  }}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


