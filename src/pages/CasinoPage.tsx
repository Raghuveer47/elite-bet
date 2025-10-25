import React, { useState } from 'react';
import { Search, Filter, Star, Play, TrendingUp, Zap, Crown, Gift, Target, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WalletProvider } from '../contexts/SupabaseWalletContext';
import { GameLauncher } from '../components/casino/GameLauncher';
import { CasinoGame } from '../types/casino';
import { formatCurrency } from '../lib/utils';

function CasinoPageContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Games', count: 5 },
    { id: 'slots', name: 'Slots', count: 1 },
    { id: 'table', name: 'Table Games', count: 3 },
    { id: 'lottery', name: 'Prize Lottery', count: 1 }
  ];

  const games: CasinoGame[] = [
    {
      id: 'mega-fortune-slots',
      name: 'Mega Fortune Slots',
      provider: 'Elite Gaming',
      category: 'slots',
      jackpot: 2500000,
      rtp: 96.4,
      minBet: 1,
      maxBet: 500,
      volatility: 'High',
      featured: true,
      image: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
    },
    {
      id: 'premium-roulette',
      name: 'Premium Roulette',
      provider: 'Elite Gaming',
      category: 'table',
      players: 247,
      rtp: 97.3,
      minBet: 1,
      maxBet: 1000,
      volatility: 'Medium',
      featured: true,
      image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
    },
    {
      id: 'professional-blackjack',
      name: 'Professional Blackjack',
      provider: 'Elite Gaming',
      category: 'table',
      rtp: 99.5,
      minBet: 5,
      maxBet: 500,
      volatility: 'Low',
      featured: true,
      image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
    },
    {
      id: 'elite-baccarat',
      name: 'Elite Baccarat',
      provider: 'Elite Gaming',
      category: 'table',
      rtp: 98.9,
      minBet: 10,
      maxBet: 1000,
      volatility: 'Medium',
      featured: true,
      image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
    },
    {
      id: 'prize-lottery',
      name: 'Prize Lottery',
      provider: 'Elite Gaming',
      category: 'lottery',
      rtp: 85.0,
      minBet: 50,
      maxBet: 1000,
      volatility: 'High',
      featured: true,
      image: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
    }
  ];

  const filteredGames = games.filter(game => 
    (selectedCategory === 'all' || game.category === selectedCategory) &&
    (searchTerm === '' || 
     game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     game.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalJackpot = games
    .filter(game => 'jackpot' in game)
    .reduce((sum, game) => sum + (game.jackpot || 0), 0);

  const getGameIcon = (gameId: string) => {
    switch (gameId) {
      case 'mega-fortune-slots': return Crown;
      case 'premium-roulette': return Target;
      case 'professional-blackjack': return Trophy;
      case 'elite-baccarat': return Crown;
      case 'prize-lottery': return Gift;
      default: return Play;
    }
  };

  const getGameGradient = (gameId: string) => {
    switch (gameId) {
      case 'mega-fortune-slots': return 'from-yellow-500 via-orange-500 to-red-500';
      case 'premium-roulette': return 'from-red-500 via-pink-500 to-purple-500';
      case 'professional-blackjack': return 'from-green-500 via-blue-500 to-purple-500';
      case 'elite-baccarat': return 'from-purple-500 via-pink-500 to-red-500';
      case 'prize-lottery': return 'from-pink-500 via-purple-500 to-blue-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              🎰 Elite Casino 🎰
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 px-4">Experience the ultimate casino games with stunning graphics and real prizes!</p>
          </div>
          
          {/* Jackpot Banner */}
          <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 border-4 border-yellow-400 shadow-2xl shadow-yellow-400/30 relative overflow-hidden mx-2 sm:mx-0">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 animate-pulse"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Crown className="w-8 h-8 sm:w-10 lg:w-12 text-yellow-200 animate-bounce" />
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">Progressive Jackpots</h2>
                  <p className="text-yellow-100 text-sm sm:text-base lg:text-lg">Total jackpot pool across all games</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white animate-pulse">{formatCurrency(totalJackpot)}</p>
                <p className="text-yellow-200 text-sm sm:text-base lg:text-lg">and growing every second...</p>
              </div>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search games or providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap">
              <Filter className="w-5 h-5" />
              <span>Advanced Filters</span>
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base lg:text-lg font-bold transition-all duration-300 transform hover:scale-110 border-2 shadow-lg whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-400 shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Featured Games Grid */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            🌟 Premium Casino Games 🌟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredGames.map(game => {
              const GameIcon = getGameIcon(game.id);
              const gradient = getGameGradient(game.id);
              
              return (
                <div key={game.id} className={`bg-gradient-to-br ${gradient}/10 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-${gradient.split('-')[1]}-500/30 overflow-hidden hover:scale-105 transition-all duration-500 group shadow-2xl relative`}>
                  {/* Animated Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="relative p-4 sm:p-6 lg:p-8">
                    {/* Game Icon */}
                    <div className="text-center mb-4 sm:mb-6">
                      <div className={`w-12 h-12 sm:w-16 lg:w-20 bg-gradient-to-br ${gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl animate-pulse`}>
                        <GameIcon className="w-6 h-6 sm:w-8 lg:w-10 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">{game.name}</h3>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-400">{game.provider}</p>
                    </div>

                    {/* Game Stats */}
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      {'jackpot' in game && game.jackpot && (
                        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-yellow-400 font-bold text-sm sm:text-base lg:text-lg">💰 Jackpot:</span>
                            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-300 animate-pulse">
                              {formatCurrency(game.jackpot)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {'players' in game && game.players !== undefined && (
                        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 font-bold text-sm sm:text-base lg:text-lg">👥 Players:</span>
                            <span className="text-base sm:text-lg lg:text-xl font-bold text-green-300">
                              {game.players.toLocaleString()} online
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-slate-600">
                          <p className="text-slate-400 text-sm">RTP</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-400">{game.rtp}%</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-slate-600">
                          <p className="text-slate-400 text-sm">Volatility</p>
                          <p className={`text-base sm:text-lg font-bold ${
                            game.volatility === 'High' ? 'text-red-400' :
                            game.volatility === 'Medium' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {game.volatility}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Bet Range:</span>
                          <span className="font-bold text-white text-sm">
                            {formatCurrency(game.minBet)} - {formatCurrency(game.maxBet)}
                          </span>
                        </div>
                      </div>

                      {/* Special Features */}
                      <div className="space-y-2">
                        {game.id === 'mega-fortune-slots' && (
                          <div className="bg-purple-600/20 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                            <p className="text-purple-400 font-bold text-xs sm:text-sm">🎰 9 Paylines • Progressive Jackpot • Wild Symbols</p>
                          </div>
                        )}
                        {game.id === 'premium-roulette' && (
                          <div className="bg-red-600/20 rounded-lg p-2 sm:p-3 border border-red-500/30">
                            <p className="text-red-400 font-bold text-xs sm:text-sm">🎯 European Wheel • Hot/Cold Stats • Live History</p>
                          </div>
                        )}
                        {game.id === 'professional-blackjack' && (
                          <div className="bg-green-600/20 rounded-lg p-2 sm:p-3 border border-green-500/30">
                            <p className="text-green-400 font-bold text-xs sm:text-sm">🃏 6-Deck Shoe • Side Bets • Strategy Helper</p>
                          </div>
                        )}
                        {game.id === 'elite-baccarat' && (
                          <div className="bg-purple-600/20 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                            <p className="text-purple-400 font-bold text-xs sm:text-sm">👑 8-Deck Shoe • Pair Bets • Trend Analysis</p>
                          </div>
                        )}
                        {game.id === 'prize-lottery' && (
                          <div className="bg-pink-600/20 rounded-lg p-2 sm:p-3 border border-pink-500/30">
                            <p className="text-pink-400 font-bold text-xs sm:text-sm">🎁 Tech Prizes • iPhone • MacBook • Higher Stakes = Higher Chances</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Play Button */}
                    <Button 
                      className={`w-full py-3 sm:py-4 text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r ${gradient} hover:scale-105 transform transition-all duration-300 shadow-2xl border-2 border-white/20`}
                      onClick={() => setSelectedGame(game)}
                    >
                      <Play className="w-4 h-4 sm:w-5 lg:w-6 mr-2 sm:mr-3" />
                      PLAY NOW
                    </Button>

                    {/* Featured Badge */}
                    {game.featured && (
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 sm:p-2 border-2 border-yellow-300 shadow-lg animate-pulse">
                          <Star className="w-4 h-4 sm:w-5 lg:w-6 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Slots Highlight */}
          <div className="bg-gradient-to-br from-yellow-600/20 via-orange-600/20 to-red-600/20 rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-yellow-500/30 shadow-xl">
            <div className="text-center">
              <Crown className="w-12 h-12 sm:w-14 lg:w-16 text-yellow-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400 mb-2 sm:mb-3">🎰 Mega Fortune Slots</h3>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">Progressive jackpot currently at {formatCurrency(2500000)}!</p>
              <div className="bg-yellow-500/20 rounded-lg p-2 sm:p-3 border border-yellow-400/30">
                <p className="text-yellow-300 font-bold text-xs sm:text-sm">👑 5 Crown symbols = JACKPOT WIN!</p>
              </div>
            </div>
          </div>

          {/* Roulette Highlight */}
          <div className="bg-gradient-to-br from-red-600/20 via-pink-600/20 to-purple-600/20 rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-red-500/30 shadow-xl">
            <div className="text-center">
              <Target className="w-12 h-12 sm:w-14 lg:w-16 text-red-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400 mb-2 sm:mb-3">🎯 Premium Roulette</h3>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">European wheel with 97.3% RTP and live statistics!</p>
              <div className="bg-red-500/20 rounded-lg p-2 sm:p-3 border border-red-400/30">
                <p className="text-red-300 font-bold text-xs sm:text-sm">🎲 Straight number pays 35:1!</p>
              </div>
            </div>
          </div>

          {/* Lottery Highlight */}
          <div className="bg-gradient-to-br from-pink-600/20 via-purple-600/20 to-blue-600/20 rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-pink-500/30 shadow-xl">
            <div className="text-center">
              <Gift className="w-12 h-12 sm:w-14 lg:w-16 text-pink-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-400 mb-2 sm:mb-3">🎁 Prize Lottery</h3>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">Win iPhone 15, MacBook Pro, and more amazing prizes!</p>
              <div className="bg-pink-500/20 rounded-lg p-2 sm:p-3 border border-pink-400/30">
                <p className="text-pink-300 font-bold text-xs sm:text-sm">📱 Higher stakes = Higher chances!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Lottery Special Section */}
        <div className="bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-blue-600/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border-2 border-pink-500/30 shadow-2xl mx-2 sm:mx-0">
          <div className="text-center mb-8">
            <Gift className="w-12 h-12 sm:w-16 lg:w-20 text-pink-400 mx-auto mb-3 sm:mb-4 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-3 sm:mb-4">
              🎁 AMAZING PRIZES AVAILABLE 🎁
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300">Win real tech gadgets and cash prizes!</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-blue-500/30 text-center">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3">📱</div>
              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-blue-400 mb-1 sm:mb-2">iPhone 15 Pro Max</h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2">1TB, Titanium Blue</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(1200)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-purple-500/30 text-center">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3">💻</div>
              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-purple-400 mb-1 sm:mb-2">MacBook Pro M3</h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2">16-inch, 1TB SSD</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(2500)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-green-500/30 text-center">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3">🎧</div>
              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-green-400 mb-1 sm:mb-2">AirPods Pro</h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2">Noise Cancelling</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(250)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-orange-500/30 text-center">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3">⌚</div>
              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-orange-400 mb-1 sm:mb-2">Apple Watch Ultra</h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2">Titanium, GPS + Cellular</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(800)}</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button 
              className="px-6 sm:px-8 lg:px-12 py-3 sm:py-4 text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:scale-110 transform transition-all duration-300 shadow-2xl border-2 border-pink-400"
              onClick={() => setSelectedGame(games.find(g => g.id === 'prize-lottery')!)}
            >
              <Gift className="w-5 h-5 sm:w-6 lg:w-8 mr-2 sm:mr-3" />
              PLAY PRIZE LOTTERY
            </Button>
          </div>
        </div>

        {/* All Games Section */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">🎮 All Casino Games</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredGames.map(game => {
              const GameIcon = getGameIcon(game.id);
              const gradient = getGameGradient(game.id);
              
              return (
                <div key={game.id} className="bg-slate-800 rounded-xl sm:rounded-2xl border-2 border-slate-700 overflow-hidden hover:border-purple-500 transition-all duration-300 group hover:scale-105 shadow-xl">
                  <div className="relative">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="w-full h-24 sm:h-32 lg:h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button 
                        className={`flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r ${gradient} text-white font-bold px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg text-xs sm:text-sm`}
                        onClick={() => setSelectedGame(game)}
                      >
                        <Play className="w-3 h-3 sm:w-4 lg:w-5" />
                        <span>PLAY</span>
                      </Button>
                    </div>
                    {game.featured && (
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                        <Star className="w-4 h-4 sm:w-5 lg:w-6 text-yellow-400 fill-current animate-pulse" />
                      </div>
                    )}
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                      <div className={`w-6 h-6 sm:w-8 lg:w-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <GameIcon className="w-3 h-3 sm:w-4 lg:w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 sm:p-3 lg:p-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1 text-white truncate">{game.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 truncate">{game.provider}</p>
                    
                    <div className="space-y-2">
                      {'jackpot' in game && game.jackpot && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Jackpot:</span>
                          <span className="text-xs sm:text-sm font-bold text-yellow-400 animate-pulse">
                            {formatCurrency(game.jackpot)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">RTP:</span>
                        <span className="text-xs sm:text-sm font-bold text-blue-400">{game.rtp}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Min Bet:</span>
                        <span className="text-xs sm:text-sm font-bold text-green-400">{formatCurrency(game.minBet)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Features */}
        <div className="mt-8 sm:mt-12 lg:mt-16 bg-gradient-to-r from-slate-800 via-purple-800/20 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-purple-500/30 shadow-2xl mx-2 sm:mx-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            🎮 Why Choose Elite Casino?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 lg:w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="w-6 h-6 sm:w-7 lg:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-green-400 mb-2">High RTP</h3>
              <p className="text-sm sm:text-base text-slate-300">Industry-leading return rates up to 99.5%</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 lg:w-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Crown className="w-6 h-6 sm:w-7 lg:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-yellow-400 mb-2">Progressive Jackpots</h3>
              <p className="text-sm sm:text-base text-slate-300">Million-dollar jackpots that grow every second</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 lg:w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Zap className="w-6 h-6 sm:w-7 lg:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-blue-400 mb-2">Instant Play</h3>
              <p className="text-sm sm:text-base text-slate-300">No downloads required, play instantly in browser</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 lg:w-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Gift className="w-6 h-6 sm:w-7 lg:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-pink-400 mb-2">Real Prizes</h3>
              <p className="text-sm sm:text-base text-slate-300">Win actual tech gadgets and cash prizes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Launcher Modal */}
      {selectedGame && (
        <GameLauncher 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
        />
      )}
    </div>
  );
}

export function CasinoPage() {
  return (
    <WalletProvider>
      <CasinoPageContent />
    </WalletProvider>
  );
}