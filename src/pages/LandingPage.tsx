import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, Trophy, Dice6, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Live Sports Betting',
      description: 'Bet on live sports with real-time odds updates and instant settlements.'
    },
    {
      icon: Dice6,
      title: 'Casino Games',
      description: 'Thousands of slots, table games, and live dealer experiences.'
    },
    {
      icon: Shield,
      title: 'Secure & Licensed',
      description: 'Bank-level security with full regulatory compliance and player protection.'
    },
    {
      icon: Zap,
      title: 'Instant Payouts',
      description: 'Lightning-fast withdrawals with multiple payment methods supported.'
    }
  ];

  const sports = [
    { name: 'Football', events: 156, icon: '🏈' },
    { name: 'Basketball', events: 89, icon: '🏀' },
    { name: 'Soccer', events: 234, icon: '⚽' },
    { name: 'Tennis', events: 67, icon: '🎾' },
    { name: 'Baseball', events: 45, icon: '⚾' },
    { name: 'Hockey', events: 32, icon: '🏒' }
  ];

  const casinoGames = [
    { name: 'Mega Fortune', jackpot: 1000000, category: 'Slots' },
    { name: 'Lightning Roulette', players: 0, category: 'Live Casino' },
    { name: 'Blackjack Pro', rtp: 99.5, category: 'Table Games' },
    { name: 'Book of Dead', popularity: 0, category: 'Slots' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-green-900/20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img 
                src="https://res.cloudinary.com/dy9zlgjh6/image/upload/v1761390123/Gemini_Generated_Image_3yxv2g3yxv2g3yxv_bcp5da.png" 
                alt="Spinzos Logo" 
                className="h-32 w-32 md:h-40 md:w-40 object-contain"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Spinzos
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              The world's most advanced betting platform. Experience lightning-fast sports betting, 
              premium casino games, and unmatched security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Betting Now
                </Button>
              </Link>
              <Link to="/sports">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Sports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Spinzos?</h2>
            <p className="text-xl text-slate-400">Industry-leading features for the ultimate betting experience</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Sports Betting</h2>
            <p className="text-xl text-slate-400">Bet on your favorite sports with the best odds</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sports.map((sport, index) => (
              <Link key={index} to="/sports" className="block">
                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-all duration-300 hover:scale-105 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{sport.icon}</span>
                      <h3 className="text-xl font-semibold">{sport.name}</h3>
                    </div>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                      {sport.events} events
                    </span>
                  </div>
                  <p className="text-slate-400">Live betting available</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Casino Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Premium Casino</h2>
            <p className="text-xl text-slate-400">Thousands of games from top providers</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {casinoGames.map((game, index) => (
              <Link key={index} to="/casino" className="block">
                <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-all duration-300 hover:scale-105 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{game.name}</h3>
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{game.category}</p>
                  {'jackpot' in game && (
                    <p className="text-green-400 font-bold">${game.jackpot.toLocaleString()}</p>
                  )}
                  {'players' in game && (
                    <p className="text-blue-400">{game.players} playing</p>
                  )}
                  {'rtp' in game && (
                    <p className="text-purple-400">{game.rtp}% RTP</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Winning?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of players and start your betting journey today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link to="/sports">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 w-full sm:w-auto">
                Browse Sports
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}