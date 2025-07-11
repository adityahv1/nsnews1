import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WifiGateContextType {
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean;
}

const WifiGateContext = createContext<WifiGateContextType | undefined>(undefined);

const WIFI_PASSWORD = 'darktalent2024!';

export const WifiGateProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = (password: string) => {
    if (password === WIFI_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  return (
    <WifiGateContext.Provider value={{ isAuthenticated, authenticate }}>
      {children}
    </WifiGateContext.Provider>
  );
};

export const useWifiGate = () => {
  const context = useContext(WifiGateContext);
  if (context === undefined) {
    throw new Error('useWifiGate must be used within a WifiGateProvider');
  }
  return context;
};