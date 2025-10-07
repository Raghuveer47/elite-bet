import React, { useState, useEffect } from 'react';
import { Gift, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PromotionService } from '../../services/promotionService';
import { Promotion, UserPromotion } from '../../types/promotions';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export function PromotionsList() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    const activePromotions = PromotionService.getActivePromotions();
    setPromotions(activePromotions);
    
    if (user) {
      const userPromos = PromotionService.getUserPromotions(user.id);
      setUserPromotions(userPromos);
    }
  }, [user]);

  const handleClaimPromotion = async (promotionId: string) => {
    if (!user) return;

    setClaimingId(promotionId);
    setIsLoading(true);

    try {
      const userPromotion = await PromotionService.claimPromotion(user.id, promotionId);
      setUserPromotions(prev => [userPromotion, ...prev]);
      toast.success('Promotion claimed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim promotion');
    } finally {
      setIsLoading(false);
      setClaimingId(null);
    }
  };

  const isPromotionClaimed = (promotionId: string) => {
    return userPromotions.some(up => up.promotionId === promotionId);
  };

  const getPromotionTypeIcon = (type: Promotion['type']) => {
    switch (type) {
      case 'welcome_bonus': return <Star className="w-5 h-5 text-yellow-400" />;
      case 'free_bet': return <Gift className="w-5 h-5 text-green-400" />;
      case 'cashback': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default: return <Gift className="w-5 h-5 text-purple-400" />;
    }
  };

  const getPromotionTypeColor = (type: Promotion['type']) => {
    switch (type) {
      case 'welcome_bonus': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'free_bet': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'cashback': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default: return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Gift className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold">Promotions & Bonuses</h3>
        </div>
        <p className="text-slate-400">
          Claim exclusive bonuses and promotions to boost your betting experience
        </p>
      </div>

      {/* Active Promotions */}
      <div className="space-y-4">
        {promotions.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No active promotions available</p>
          </div>
        ) : (
          promotions.map(promotion => {
            const isClaimed = isPromotionClaimed(promotion.id);
            const userPromo = userPromotions.find(up => up.promotionId === promotion.id);
            
            return (
              <div key={promotion.id} className={`rounded-xl p-6 border ${getPromotionTypeColor(promotion.type)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getPromotionTypeIcon(promotion.type)}
                    <div>
                      <h4 className="text-xl font-bold text-white">{promotion.name}</h4>
                      <p className="text-slate-300">{promotion.description}</p>
                    </div>
                  </div>
                  
                  {isClaimed ? (
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                      <span className="text-xs text-green-400">Claimed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleClaimPromotion(promotion.id)}
                      disabled={isLoading}
                      className="min-w-[100px]"
                    >
                      {claimingId === promotion.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        'Claim Now'
                      )}
                    </Button>
                  )}
                </div>

                {/* Promotion Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Reward</p>
                    <p className="font-bold">
                      {promotion.reward.type === 'percentage' 
                        ? `${promotion.reward.value}% up to ${formatCurrency(promotion.reward.maxAmount || 0)}`
                        : formatCurrency(promotion.reward.value)
                      }
                    </p>
                  </div>
                  
                  {promotion.reward.wagering && (
                    <div>
                      <p className="text-sm text-slate-400">Wagering</p>
                      <p className="font-bold">{promotion.reward.wagering}x</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-slate-400">Valid Until</p>
                    <p className="font-bold">{promotion.endDate.toLocaleDateString()}</p>
                  </div>
                </div>

                {/* User Promotion Progress */}
                {userPromo && (
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Wagering Progress</h5>
                      <span className="text-sm text-slate-400">
                        {formatCurrency(userPromo.wageringCompleted)} / {formatCurrency(userPromo.wageringRequired)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (userPromo.wageringCompleted / userPromo.wageringRequired) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {userPromo.status === 'completed' 
                        ? 'Wagering completed! Bonus converted to cash.'
                        : `${Math.max(0, userPromo.wageringRequired - userPromo.wageringCompleted).toFixed(2)} more wagering required`
                      }
                    </p>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="text-xs text-slate-400">
                  <p className="font-medium mb-1">Terms & Conditions:</p>
                  <p>{promotion.terms}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* My Active Promotions */}
      {userPromotions.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h4 className="text-lg font-semibold mb-4">My Active Promotions</h4>
          
          <div className="space-y-3">
            {userPromotions.filter(up => up.status === 'active' || up.status === 'claimed').map(userPromo => {
              const promotion = promotions.find(p => p.id === userPromo.promotionId);
              if (!promotion) return null;
              
              return (
                <div key={userPromo.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{promotion.name}</h5>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      userPromo.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      userPromo.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {userPromo.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Bonus Amount</p>
                      <p className="font-bold text-green-400">{formatCurrency(userPromo.bonusAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expires</p>
                      <p className="font-bold">{userPromo.expiresAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}