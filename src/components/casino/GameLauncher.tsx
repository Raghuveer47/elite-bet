import { useState } from 'react';
import { ArrowLeft, Star, Info, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { SlotMachine } from './SlotMachine';
import { BlackjackGame } from './BlackjackGame';
import Roulette from './Roulette';
import Mines from './Mines';
import { BaccaratGame } from './BaccaratGame';
import { LotteryGame } from './LotteryGame';
import { CasinoGame } from '../../types/casino';

interface GameLauncherProps {
  game: CasinoGame;
  onClose: () => void;
}

export function GameLauncher({ game, onClose }: GameLauncherProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const renderGame = () => {
    // Route games by ID for exact matching
    if (game.id === 'mega-fortune-slots') {
      return <SlotMachine gameId={game.id} gameName={game.name} />;
    }
    if (game.id === 'premium-roulette') {
      return <Roulette gameId={game.id} gameName={game.name} />;
    }
    if (game.id === 'mines') {
      return <Mines gameId={game.id} gameName={game.name} />;
    }
    if (game.id === 'professional-blackjack') {
      return <BlackjackGame gameId={game.id} gameName={game.name} />;
    }
    if (game.id === 'elite-baccarat') {
      return <BaccaratGame gameId={game.id} gameName={game.name} />;
    }
    if (game.id === 'prize-lottery') {
      return <LotteryGame gameId={game.id} gameName={game.name} />;
    }
    
    // Fallback for any unmatched games
    return (
      <div className="text-center p-8">
        <h3 className="text-2xl font-bold text-red-400 mb-4">Game Not Found</h3>
        <p className="text-slate-400 mb-4">Game ID: {game.id}</p>
        <p className="text-slate-400 mb-4">Category: {game.category}</p>
        <Button onClick={onClose}>Return to Casino</Button>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/95 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-0 sm:p-4'}`}>
      <div className={`bg-slate-900 ${isFullscreen ? 'w-full h-full' : 'rounded-none sm:rounded-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[95vh] h-full sm:h-auto'} overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 lg:p-6 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <Button variant="ghost" onClick={onClose} className="p-1 sm:p-2">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {game.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center space-x-1 sm:space-x-2">
                <span className="hidden sm:inline">{game.provider}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-green-400">RTP: {game.rtp}%</span>
              </p>
            </div>
            {game.featured && <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 fill-current hidden sm:block" />}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 sm:p-2 hidden sm:flex">
              {soundEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="p-1 sm:p-2 hidden sm:flex">
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <Button variant="outline" onClick={() => setShowInfo(!showInfo)} className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Info</span>
            </Button>
          </div>
        </div>

        {/* Game Info Panel */}
        {showInfo && (
          <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Game Details</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400">RTP: <span className="text-green-400 font-bold">{game.rtp}%</span></p>
                  <p className="text-slate-400">Volatility: <span className={`font-bold ${
                    game.volatility === 'High' ? 'text-red-400' :
                    game.volatility === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>{game.volatility}</span></p>
                  <p className="text-slate-400">Category: <span className="text-purple-400 font-bold capitalize">{game.category}</span></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Betting Limits</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400">Min Bet: <span className="text-green-400 font-bold">{formatCurrency(game.minBet)}</span></p>
                  <p className="text-slate-400">Max Bet: <span className="text-red-400 font-bold">{formatCurrency(game.maxBet)}</span></p>
                  <p className="text-slate-400">Recommended: <span className="text-blue-400 font-bold">{formatCurrency(game.minBet * 10)}</span></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Special Features</h3>
                <div className="space-y-1 text-sm">
                  {game.jackpot && (
                    <p className="text-slate-400">Jackpot: <span className="text-yellow-400 font-bold animate-pulse">{formatCurrency(game.jackpot)}</span></p>
                  )}
                  {game.players && (
                    <p className="text-slate-400">Active Players: <span className="text-blue-400 font-bold">{game.players}</span></p>
                  )}
                  <p className="text-slate-400">Provider: <span className="text-purple-400 font-bold">{game.provider}</span></p>
                  <p className="text-slate-400">Certified: <span className="text-green-400 font-bold">✓ Fair Play</span></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Game Features</h3>
                <div className="space-y-1 text-sm">
                  {game.category === 'slots' && (
                    <>
                      <p className="text-slate-400">Paylines: <span className="text-blue-400 font-bold">9 Ways</span></p>
                      <p className="text-slate-400">Wilds: <span className="text-purple-400 font-bold">⭐ Star</span></p>
                      <p className="text-slate-400">Scatters: <span className="text-orange-400 font-bold">💎 Diamond</span></p>
                    </>
                  )}
                  {game.category === 'table' && game.name.includes('Blackjack') && (
                    <>
                      <p className="text-slate-400">Decks: <span className="text-blue-400 font-bold">6 Deck Shoe</span></p>
                      <p className="text-slate-400">Side Bets: <span className="text-purple-400 font-bold">Available</span></p>
                      <p className="text-slate-400">Strategy: <span className="text-green-400 font-bold">Helper</span></p>
                    </>
                  )}
                  {game.category === 'table' && game.name.includes('Roulette') && (
                    <>
                      <p className="text-slate-400">Type: <span className="text-blue-400 font-bold">European</span></p>
                      <p className="text-slate-400">Statistics: <span className="text-purple-400 font-bold">Hot/Cold</span></p>
                      <p className="text-slate-400">History: <span className="text-green-400 font-bold">20 Spins</span></p>
                    </>
                  )}
                  {game.id === 'elite-baccarat' && (
                    <>
                      <p className="text-slate-400">Decks: <span className="text-blue-400 font-bold">8 Deck Shoe</span></p>
                      <p className="text-slate-400">Side Bets: <span className="text-purple-400 font-bold">Pairs</span></p>
                      <p className="text-slate-400">Trends: <span className="text-green-400 font-bold">Live Stats</span></p>
                    </>
                  )}
                  {game.id === 'prize-lottery' && (
                    <>
                      <p className="text-slate-400">Prizes: <span className="text-blue-400 font-bold">Tech & Cash</span></p>
                      <p className="text-slate-400">Numbers: <span className="text-purple-400 font-bold">Pick 6 of 49</span></p>
                      <p className="text-slate-400">Chances: <span className="text-green-400 font-bold">Stake Based</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Game Rules */}
            <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">How to Play</h4>
              <div className="text-sm text-slate-300">
                {game.category === 'slots' && (
                  <p>Select your bet amount and number of paylines, then spin the reels. Match 3 or more symbols on active paylines to win. Look for special symbols like Wilds (⭐) and Scatters (💎) for bonus features!</p>
                )}
                {game.category === 'table' && game.name.includes('Blackjack') && (
                  <p>Get as close to 21 as possible without going over. Beat the dealer's hand to win. Aces count as 1 or 11, face cards count as 10. Blackjack (21 with first 2 cards) pays 3:2!</p>
                )}
                {game.category === 'table' && game.name.includes('Roulette') && (
                  <p>Place bets on numbers, colors, or combinations. The wheel spins and if the ball lands on your bet, you win! Straight number bets pay 35:1, while color/even-odd bets pay 1:1.</p>
                )}
                {game.id === 'elite-baccarat' && (
                  <p>Bet on Player, Banker, or Tie. Closest to 9 wins! Cards 2-9 = face value, 10/J/Q/K = 0, Ace = 1. Only the last digit counts (15 = 5). Natural  8 or 9 wins immediately!</p>
                )}
                {game.id === 'prize-lottery' && (
                  <p>Pick 6 numbers from 1-49 and choose your stake. Higher stakes dramatically increase your chances of winning amazing prizes like iPhones, MacBooks, and cash! Draw the lottery to see if you win!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Content */}
        <div className={`${isFullscreen ? 'p-4 sm:p-8' : 'p-0 sm:p-4 md:p-6'}`}>
          {renderGame()}
        </div>
      </div>
    </div>
  );
}