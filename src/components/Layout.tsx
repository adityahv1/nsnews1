import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, BarChart3, PlusCircle, User, LogOut, Settings } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userProfile, signOut } = useAuth();
  const { isAuthenticated } = useWifiGate();
  const location = useLocation();

  // Redirect to wifi page if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">NS News</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link to="/">
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Newspaper className="h-4 w-4" />
                  News
                </Button>
              </Link>
              
              <Link to="/polls">
                <Button
                  variant={isActive('/polls') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Polls
                </Button>
              </Link>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <Link to="/posts/new">
                    <Button size="sm" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Post News
                    </Button>
                  </Link>
                  
                  <Link to={`/profile/${userProfile?.email}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      {userProfile?.name || user?.email}
                    </Button>
                  </Link>
                  
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="flex items-center gap-2 text-white hover:text-gray-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Anonymous</Badge>
                  <AuthModal />
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;