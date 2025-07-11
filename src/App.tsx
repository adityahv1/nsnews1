import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWifiGate } from '@/contexts/WifiGateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { WifiGateProvider } from '@/contexts/WifiGateContext';
import WifiGatePage from '@/pages/WifiGatePage';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import PostDetail from '@/pages/PostDetail';
import CreatePost from '@/pages/CreatePost';
import PollsPage from '@/pages/PollsPage';
import ProfilePage from '@/pages/ProfilePage';
import ProfileSettings from '@/pages/ProfileSettings';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated } = useWifiGate();

  if (!isAuthenticated) {
    return <WifiGatePage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/new" element={<CreatePost />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/polls" element={<PollsPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings" element={<ProfileSettings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <WifiGateProvider>
            <AppContent />
            <Toaster />
          </WifiGateProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;