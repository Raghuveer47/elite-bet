import { useState } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, 
  DollarSign, Shield
} from 'lucide-react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../lib/utils';

export function UserManagement() {
  const { 
    users, 
    updateUserStatus, 
    verifyUser, 
    updateUserBalance, 
    isLoading 
  } = useAdmin();
  
  // Debug logging
  console.log('UserManagement: Users loaded:', users.length, users);
  console.log('UserManagement: Is loading:', isLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState({ amount: 0, reason: '' });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'closed') => {
    try {
      await updateUserStatus(userId, newStatus);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await verifyUser(userId);
      
      // Trigger storage event for user context sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_user_verified',
        newValue: JSON.stringify({ userId })
      }));
    } catch (error) {
      console.error('Failed to verify user:', error);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !balanceAdjustment.reason || balanceAdjustment.amount === 0) return;
    
    try {
      await updateUserBalance(selectedUser, balanceAdjustment.amount);
      setShowBalanceModal(false);
      setBalanceAdjustment({ amount: 0, reason: '' });
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to adjust balance:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'suspended': return 'text-yellow-400 bg-yellow-500/10';
      case 'closed': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>

          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-slate-400">
                        {users.length === 0 ? 'No users found in database' : 'No users match your search criteria'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {user.isVerified ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-xs text-slate-400">
                              {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-green-400">{formatCurrency(user.balance)}</p>
                        <p className="text-xs text-slate-400">Active: {formatCurrency(user.activeBets)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(user.riskLevel)}`}>
                        {user.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400">
                        <p>Deposited: {formatCurrency(user.totalDeposited)}</p>
                        <p>Wagered: {formatCurrency(user.totalWagered)}</p>
                        <p>Last: {formatDate(user.lastLogin)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setShowBalanceModal(true);
                          }}
                          title="Adjust Balance"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        
                        {!user.isVerified && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                            title="Verify User"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as any)}
                          className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                          disabled={isLoading}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance Adjustment Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Adjust User Balance</h3>
            
            <div className="space-y-4">
              <Input
                label="Adjustment Amount"
                type="number"
                value={balanceAdjustment.amount}
                onChange={(e) => setBalanceAdjustment(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Enter amount (positive to add, negative to subtract)"
                step="0.01"
              />
              
              <Input
                label="Reason"
                value={balanceAdjustment.reason}
                onChange={(e) => setBalanceAdjustment(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Reason for adjustment"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBalanceModal(false);
                  setBalanceAdjustment({ amount: 0, reason: '' });
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBalanceAdjustment}
                disabled={!balanceAdjustment.reason || balanceAdjustment.amount === 0 || isLoading}
              >
                {isLoading ? 'Adjusting...' : 'Adjust Balance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}