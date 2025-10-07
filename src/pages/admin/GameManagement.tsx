import React, { useState } from 'react';
import { 
  Gamepad2, Settings, BarChart3, TrendingUp, Play, Pause, DollarSign,
  Edit, Eye, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../lib/utils';

export function GameManagement() {
  const { games, updateGameStatus, updateGameRTP, isLoading } = useAdmin();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showRTPModal, setShowRTPModal] = useState(false);
  const [newRTP, setNewRTP] = useState(96);

  const handleToggleGame = async (gameId: string, currentStatus: boolean) => {
    try {
      await updateGameStatus(gameId, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle game status:', error);
    }
  };

  const handleUpdateRTP = async () => {
    if (!selectedGame) return;
    
    try {
      await updateGameRTP(selectedGame, newRTP);
      setShowRTPModal(false);
      setSelectedGame(null);
      setNewRTP(96);
    } catch (error) {
      console.error('Failed to update RTP:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'slots': return 'text-purple-400 bg-purple-500/10';
      case 'table': return 'text-blue-400 bg-blue-500/10';
      case 'live': return 'text-red-400 bg-red-500/10';
      case 'jackpots': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getPerformanceColor = (profitMargin: number) => {
    if (profitMargin >= 8) return 'text-green-400';
    if (profitMargin >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalGamesRevenue = games.reduce((sum, game) => sum + (game.totalWagered - game.totalPayout), 0);
  const averageRTP = games.length > 0 ? games.reduce((sum, game) => sum + game.rtp, 0) / games.length : 0;
  const activeGames = games.filter(game => game.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Game Management</h1>
          <p className="text-slate-400">Monitor and configure casino games</p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Game Settings
        </Button>
      </div>

      {/* Game Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Gamepad2 className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">{games.length}</span>
          </div>
          <p className="text-slate-400 text-sm">Total Games</p>
          <p className="text-xs text-slate-500">{activeGames} active</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">{formatCurrency(totalGamesRevenue)}</span>
          </div>
          <p className="text-slate-400 text-sm">Games Revenue</p>
          <p className="text-xs text-green-400">+12.5% vs last period</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">{averageRTP.toFixed(1)}%</span>
          </div>
          <p className="text-slate-400 text-sm">Average RTP</p>
          <p className="text-xs text-slate-500">Across all games</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">
              {games.reduce((sum, game) => sum + game.totalPlayed, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Total Plays</p>
          <p className="text-xs text-yellow-400">+8.3% vs last period</p>
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Game Performance</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Game</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">RTP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Plays</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {games.map(game => (
                  <tr key={game.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{game.name}</p>
                        <p className="text-xs text-slate-400">{game.provider}</p>
                        <p className="text-xs text-slate-500">Last played: {formatDate(game.lastPlayed)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(game.category)}`}>
                        {game.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-blue-400">{game.rtp}%</p>
                        <p className={`text-xs ${getPerformanceColor(game.profitMargin)}`}>
                          Margin: {game.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-green-400">
                          {formatCurrency(game.totalWagered - game.totalPayout)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Wagered: {formatCurrency(game.totalWagered)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{game.totalPlayed.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {game.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-xs text-slate-400">
                          {game.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant={game.isActive ? "danger" : "secondary"} 
                          size="sm"
                          onClick={() => handleToggleGame(game.id, game.isActive)}
                          disabled={isLoading}
                          title={game.isActive ? 'Deactivate Game' : 'Activate Game'}
                        >
                          {game.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedGame(game.id);
                            setNewRTP(game.rtp);
                            setShowRTPModal(true);
                          }}
                          title="Edit RTP"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RTP Update Modal */}
      {showRTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Update Game RTP</h3>
            
            <div className="space-y-4">
              <Input
                label="New RTP (%)"
                type="number"
                value={newRTP}
                onChange={(e) => setNewRTP(parseFloat(e.target.value) || 96)}
                placeholder="Enter RTP percentage"
                min="85"
                max="99"
                step="0.1"
              />
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-400 font-medium">Warning</p>
                    <p className="text-xs text-slate-300">
                      Changing RTP affects game profitability and player experience. 
                      This action will be logged for compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRTPModal(false);
                  setSelectedGame(null);
                  setNewRTP(96);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRTP}
                disabled={newRTP < 85 || newRTP > 99 || isLoading}
              >
                {isLoading ? 'Updating...' : 'Update RTP'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}