import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, LogOut } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userProfile, signOut } = useAuth();
  const { isAuthenticated } = useWifiGate();

  // Redirect to wifi page if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center">
              <img src="src/assets/ns-com-news-logo.png" alt="NS News" className="h-8" />
            </Link>
            
            <nav className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/posts/new">
                    <Button size="sm" className="text-sm font-normal h-8 px-3">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </Link>
                  
                  <Link to={`/profile/${userProfile?.email}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm font-normal h-8 px-3"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Profile
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-sm font-normal h-8 px-3 text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <AuthModal />
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;