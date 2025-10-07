import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';

interface NotificationEvent {
  type: 'mega_win' | 'jackpot' | 'lottery_prize' | 'sports_upset' | 'new_player' | 'withdrawal';
  user: string;
  amount?: number;
  game?: string;
  prize?: string;
  country: string;
}

const COUNTRIES = ['🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇳🇱', '🇸🇪'];
const NAMES = ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Anna', 'Tom', 'Maria'];
const GAMES = ['Mega Fortune', 'Lightning Roulette', 'Blackjack Pro', 'Starburst', 'Book of Dead'];
const SPORTS = ['Lakers vs Celtics', 'Chiefs vs Bills', 'Man City vs Arsenal'];
const PRIZES = ['iPhone 15 Pro Max', 'MacBook Pro M3', 'Apple Watch Ultra', 'AirPods Pro'];

export function useRealisticNotifications() {
  useEffect(() => {
    const generateEvent = (): NotificationEvent => {
      const types: NotificationEvent['type'][] = [
        'mega_win', 'jackpot', 'lottery_prize', 'sports_upset', 'new_player', 'withdrawal'
      ];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const user = `${name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;

      switch (type) {
        case 'mega_win':
          return {
            type,
            user,
            amount: Math.floor(Math.random() * 50000) + 10000,
            game: GAMES[Math.floor(Math.random() * GAMES.length)],
            country
          };
        case 'jackpot':
          return {
            type,
            user,
            amount: Math.floor(Math.random() * 500000) + 100000,
            game: 'Progressive Jackpot',
            country
          };
        case 'lottery_prize':
          return {
            type,
            user,
            amount: Math.floor(Math.random() * 2500) + 500,
            prize: PRIZES[Math.floor(Math.random() * PRIZES.length)],
            country
          };
        case 'sports_upset':
          return {
            type,
            user,
            amount: Math.floor(Math.random() * 15000) + 2000,
            game: SPORTS[Math.floor(Math.random() * SPORTS.length)],
            country
          };
        case 'new_player':
          return {
            type,
            user,
            amount: 100,
            country
          };
        case 'withdrawal':
          return {
            type,
            user,
            amount: Math.floor(Math.random() * 25000) + 1000,
            country
          };
        default:
          return {
            type: 'mega_win',
            user,
            amount: 1000,
            game: 'Slots',
            country
          };
      }
    };

    const showNotification = (event: NotificationEvent) => {
      switch (event.type) {
        case 'mega_win':
          toast.success(
            `🎰 ${event.user} ${event.country} just won ${formatCurrency(event.amount!)} on ${event.game}!`,
            { 
              duration: 6000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }
          );
          break;
        case 'jackpot':
          toast.success(
            `💰 JACKPOT! ${event.user} ${event.country} hit ${formatCurrency(event.amount!)} on ${event.game}!`,
            { 
              duration: 8000,
              style: {
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%)',
                color: '#fff',
                border: '3px solid #fcd34d',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
              }
            }
          );
          break;
        case 'lottery_prize':
          toast.success(
            `🎁 ${event.user} ${event.country} won ${event.prize} worth ${formatCurrency(event.amount!)} in Prize Lottery!`,
            { 
              duration: 7000,
              style: {
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#fff',
                border: '2px solid #f472b6',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }
          );
          break;
        case 'sports_upset':
          toast.success(
            `⚽ UPSET WIN! ${event.user} ${event.country} won ${formatCurrency(event.amount!)} on ${event.game}!`,
            { 
              duration: 6000,
              style: {
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#fff',
                border: '2px solid #0ea5e9',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }
          );
          break;
        case 'new_player':
          toast.success(
            `🎊 Welcome ${event.user} ${event.country} to Elite Bet! Received ${formatCurrency(event.amount!)} bonus!`,
            { 
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: '2px solid #34d399',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 'bold'
              }
            }
          );
          break;
        case 'withdrawal':
          toast.success(
            `💸 ${event.user} ${event.country} successfully withdrew ${formatCurrency(event.amount!)}!`,
            { 
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#fff',
                border: '2px solid #10b981',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 'bold'
              }
            }
          );
          break;
      }
    };

    // Generate notifications at random intervals
    const generateNotification = () => {
      const event = generateEvent();
      showNotification(event);
    };

    // Initial burst
    setTimeout(() => generateNotification(), 2000);
    setTimeout(() => generateNotification(), 4000);
    setTimeout(() => generateNotification(), 6000);

    // Regular notifications
    const interval = setInterval(() => {
      if (Math.random() < 0.8) { // 80% chance
        generateNotification();
      }
    }, Math.random() * 6000 + 3000); // 3-9 seconds

    return () => clearInterval(interval);
  }, []);
}