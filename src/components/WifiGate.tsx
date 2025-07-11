import { useState } from 'react';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wifi } from 'lucide-react';

const WifiGate = () => {
  const { isAuthenticated, authenticate } = useWifiGate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(password)) {
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Wifi className="h-6 w-6 text-blue-600" />
            NS WiFi Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Enter the password to proceed</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full"
              autoFocus
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full">
            Connect
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WifiGate;