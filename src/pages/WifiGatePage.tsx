import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';

const WifiGatePage = () => {
  const { authenticate } = useWifiGate();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (authenticate(password)) {
      setError('');
      setPassword('');
      navigate('/');
    } else {
      setError('Incorrect password. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-none border-0 rounded-3xl bg-white">
          <CardContent className="p-12">
            <div className="text-center space-y-8">
              {/* Logo and Title */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                    <Plus className="h-8 w-8 text-white" strokeWidth={3} />
                  </div>
                </div>
                <div className="space-y-2">
                  <img src= "src/assets/Screenshot 2025-07-11 at 8.49.57 PM.png"/>
                  <p className="text-xl text-gray-500 font-normal">for News only, members channel.</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-14 px-6 text-lg bg-white border-0 rounded-full focus:outline-none focus:ring-0 focus:border-0 placeholder:text-gray-400 shadow-none"
                    autoFocus
                    required
                  />
                  
                  {error && (
                    <div className="text-red-500 text-sm text-center">
                      {error}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-black hover:bg-gray-800 text-white text-lg font-medium rounded-full flex items-center justify-center gap-2 transition-colors border-0 focus:outline-none focus:ring-0"
                  disabled={loading || !password.trim()}
                >
                  Login
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WifiGatePage;