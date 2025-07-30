import React, { createContext, useContext, ReactNode } from 'react';
import { theme } from '../constants/theme';

// Create theme context
const ThemeContext = createContext(theme);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hooks for specific theme properties
export const useColors = () => useTheme().colors;
export const useSpacing = () => useTheme().spacing;
export const useTypography = () => useTheme().typography;
export const useRadius = () => useTheme().radius;
export const useElevation = () => useTheme().elevation;
