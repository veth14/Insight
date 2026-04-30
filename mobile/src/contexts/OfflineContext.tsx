
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineContextData {
  isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextData>({
  isOffline: false,
});

export const useOffline = () => {
  return useContext(OfflineContext);
};

export const OfflineProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};
