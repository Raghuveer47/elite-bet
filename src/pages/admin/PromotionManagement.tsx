import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit, Eye, Trash2, Users, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PromotionService } from '../../services/promotionService';
import { Promotion, UserPromotion } from '../../types/promotions';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    type: 'deposit_bonus' as Promotion['type'],
    rewardType: 'percentage' as const,
    rewardValue: 0,
    maxAmount: 0,
    wagering: 1,
    minDeposit: 0,
    startDate: '',
    endDate: '',
    terms: ''
  });

  useEffect(() => {
    const promoData = PromotionService.loadPromoData();
    setPromotions(promoData.promotions || []);
    setUserPromotions(promoData.userPromotions || []);
  }, []);

  const handleCreatePromotion = async () => {
    if (!newPromotion.name.trim() || !newPromotion.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const promotion: Promotion = {
        id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newPromotion.name,
        description: newPromotion.description,
        type: newPromotion.type,
        status: 'active',
        startDate: new Date(newPromotion.startDate),
        endDate: new Date(newPromotion.endDate),
        terms: newPromotion.terms,
        eligibility: {
          minDeposit: newPromotion.minDeposit,
          newUsersOnly: newPromotion.type === 'welcome_bonus'
        },
        reward: {
          type: newPromotion.rewardType,
          value: newPromotion.rewardValue,
          maxAmount: newPromotion.maxAmount,
          currency: 'USD',
          wagering: newPromotion.wagering
        },
        usage: {
          totalClaimed: 0,
          totalRedeemed: 0,
          totalValue: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const promoData = PromotionService.loadPromoData();
      promoData.promotions = [promotion, ...promoData.promotions];
      PromotionService.savePromoData(promoData);

      setPromotions(prev => [promotion, ...prev]);
      setShowCreateModal(false);
      setNewPromotion({
        name: '', description: '', type: 'deposit_bonus', rewardType: 'percentage',
        rewardValue: 0, maxAmount: 0, wagering: 1, minDeposit: 0,
        startDate: '', endDate: '', terms: ''
      });
      toast.success('Promotion created successfully');
    } catch (error) {
      toast.error('Failed to create promotion');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Promotion['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'inactive': return 'text-slate-400 bg-slate-500/10';
      case 'expired': return 'text-red-400 bg-red-500/10';
      case 'draft': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getPromotionStats = (promotionId: string) => {
    const claims = userPromotions.filter(up => up.promotionId === promotionId);
    return {
      totalClaims: claims.length,
      activeClaims: claims.filter(up => up.status === 'active').length,
      completedClaims: claims.filter(up => up.status === 'completed').length,
      totalValue: claims.reduce((sum, up) => sum + up.bonusAmount, 0)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Promotion Management</h1>
          <p className="text-slate-400">Create and manage promotional campaigns</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Promotion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">{promotions.length}</span>
          </div>
          <p className="text-slate-400 text-sm">Total Promotions</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">{userPromotions.length}</span>
          </div>
          <p className="text-slate-400 text-sm">Total Claims</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(userPromotions.reduce((sum, up) => sum + up.bonusAmount, 0))}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Total Value</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">
              {promotions.filter(p => p.status === 'active').length}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Active Promotions</p>
        </div>
      </div>

      {/* Promotions List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">All Promotions</h3>
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No promotions created yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {promotions.map(promotion => {
              const stats = getPromotionStats(promotion.id);
              
              return (
                <div key={promotion.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{promotion.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(promotion.status)}`}>
                          {promotion.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-300 mb-3">{promotion.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Type</p>
                          <p className="font-medium text-blue-400">{promotion.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Reward</p>
                          <p className="font-medium text-green-400">
                            {promotion.reward.type === 'percentage' 
                              ? `${promotion.reward.value}%`
                              : formatCurrency(promotion.reward.value)
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Claims</p>
                          <p className="font-medium text-purple-400">{stats.totalClaims}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Total Value</p>
                          <p className="font-medium text-yellow-400">{formatCurrency(stats.totalValue)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <p>Valid: {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</p>
                    <p>Terms: {promotion.terms}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Promotion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-white mb-6">Create New Promotion</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Promotion Name"
                  value={newPromotion.name}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Bonus"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={newPromotion.type}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="welcome_bonus">Welcome Bonus</option>
                    <option value="deposit_bonus">Deposit Bonus</option>
                    <option value="free_bet">Free Bet</option>
                    <option value="cashback">Cashback</option>
                    <option value="loyalty_points">Loyalty Points</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newPromotion.description}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the promotion"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reward Type</label>
                  <select
                    value={newPromotion.rewardType}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, rewardType: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>
                
                <Input
                  label={newPromotion.rewardType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  type="number"
                  value={newPromotion.rewardValue}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, rewardValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step={newPromotion.rewardType === 'percentage' ? '1' : '0.01'}
                />
                
                {newPromotion.rewardType === 'percentage' && (
                  <Input
                    label="Max Amount ($)"
                    type="number"
                    value={newPromotion.maxAmount}
                    onChange={(e) => setNewPromotion(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="datetime-local"
                  value={newPromotion.startDate}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                
                <Input
                  label="End Date"
                  type="datetime-local"
                  value={newPromotion.endDate}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Terms & Conditions</label>
                <textarea
                  value={newPromotion.terms}
                  onChange={(e) => setNewPromotion(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Detailed terms and conditions"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePromotion}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Promotion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}