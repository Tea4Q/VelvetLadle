import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isTablet: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  gridColumns: number;
  cardWidth: number;
  maxContentWidth: number;
}

export const getResponsiveConfig = (): ResponsiveConfig => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  
  // Define tablet breakpoints
  const isTablet = Platform.OS === 'web' 
    ? width >= 768 
    : (width >= 768 || height >= 768);
  
  // Calculate optimal grid columns based on screen size
  let gridColumns = 1;
  if (isTablet) {
    if (width >= 1200) {
      gridColumns = 3;
    } else if (width >= 900) {
      gridColumns = 2;
    } else {
      gridColumns = isLandscape ? 2 : 1;
    }
  }
  
  // Calculate card width for grid layout
  const padding = 20;
  const gap = 16;
  const cardWidth = gridColumns === 1 
    ? width - (padding * 2)
    : (width - (padding * 2) - (gap * (gridColumns - 1))) / gridColumns;
  
  // Max content width for very large screens
  const maxContentWidth = Math.min(width, 1200);
  
  return {
    isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
    gridColumns,
    cardWidth,
    maxContentWidth,
  };
};

export const useResponsive = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>(getResponsiveConfig);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setConfig(getResponsiveConfig());
    });

    return () => subscription?.remove();
  }, []);

  return config;
};
