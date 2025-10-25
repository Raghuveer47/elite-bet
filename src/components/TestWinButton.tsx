import { Button } from './ui/Button';
import { useWallet } from '../contexts/SupabaseWalletContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import toast from 'react-hot-toast';

export function TestWinButton() {
  const { user } = useAuth();
  const { processWin, getBalance } = useWallet();

  const handleTestWin = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    const winAmount = 100; // Test win amount
    const currentBalance = getBalance();
    
    try {
      await processWin(winAmount, 'Test Game', 'Test win for verification');
      toast.success(`Test win of $${winAmount} processed! New balance: $${currentBalance + winAmount}`);
    } catch (error) {
      console.error('Test win failed:', error);
      toast.error('Test win failed');
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleTestWin}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        🎰 Test Win $100
      </Button>
    </div>
  );
}
