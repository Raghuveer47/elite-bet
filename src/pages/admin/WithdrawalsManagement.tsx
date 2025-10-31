import React, { useMemo } from 'react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';

export function WithdrawalsManagement() {
  const { pendingPayments, approveWithdrawal, rejectWithdrawal, refreshData, isLoading } = useAdmin() as any;

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
              <th className="px-4 py-3">Reference</th>
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
                <td className="px-4 py-3">{w.reference || '-'}</td>
                <td className="px-4 py-3">{new Date(w.submittedAt || w.submittedAt || w.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 space-x-2">
                  <Button onClick={() => approveWithdrawal(w.id)} className="bg-green-600 hover:bg-green-500">Approve</Button>
                  <Button variant="outline" onClick={() => rejectWithdrawal(w.id, 'Admin rejected')}>Reject</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


