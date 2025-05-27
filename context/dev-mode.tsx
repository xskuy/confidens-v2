'use client';

import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  setIsDevMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

// Variable global para acceso directo al estado
const globalDevModeState = { isDevMode: false };

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false); // Default a false

  // Actualizar el estado global cuando cambia
  React.useEffect(() => {
    globalDevModeState.isDevMode = isDevMode;
  }, [isDevMode]);

  return (
    <DevModeContext.Provider value={{ isDevMode, setIsDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}

// Función para obtener el estado sin el hook
export function getDevModeState() {
  return globalDevModeState;
}
