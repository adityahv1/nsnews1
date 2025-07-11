import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, CornerDownLeft } from 'lucide-react';

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
      <div className="w-full max-w-sm mx-auto">
        <Card className="shadow-none border-0 rounded-3xl bg-white mx-auto">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="text-center space-y-6 w-full flex flex-col items-center">
              {/* Logo and Title */}
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                    <Plus className="h-8 w-8 text-white" strokeWidth={3} />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col items-center">
                  <img src="src/assets/ns-com-news-logo.png" className="mx-auto max-w-full h-auto"/>
                  <p className="text-xl text-gray-500 font-normal text-center">for News only, members channel.</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
                <div className="space-y-4 w-full">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-10 px-4 text-base bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 placeholder:text-gray-400 shadow-none text-center"
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
                  className="w-full h-10 bg-gray-900 hover:bg-black text-white text-base font-normal rounded-lg flex items-center justify-center gap-2 transition-colors border-0 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  disabled={loading || !password.trim()}
                >
                  Enter
                  <CornerDownLeft className="h-4 w-4" />
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