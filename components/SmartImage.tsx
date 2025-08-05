import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import { ImageStorageService } from '../services/ImageStorageService';

interface SmartImageProps {
  imageUrl?: string;
  recipeId: number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  placeholder?: any;
  fallbackIcon?: string;
  onError?: (error: any) => void;
  onLoad?: () => void;
}

/**
 * Smart Image Component for Recipe Images
 * 
 * This component automatically handles:
 * - Local image caching
 * - Fallback to remote URLs
 * - Loading states
 * - Error handling
 * - Placeholder images
 */
export default function SmartImage({
  imageUrl,
  recipeId,
  style,
  resizeMode = 'cover',
  placeholder,
  fallbackIcon = '🍽️',
  onError,
  onLoad,
}: SmartImageProps) {
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl || !recipeId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    loadImage();
  }, [imageUrl, recipeId]);

  const loadImage = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const source = await ImageStorageService.getImageSource(imageUrl, recipeId);
      
      if (source) {
        setImageSource(source);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('SmartImage: Error loading image:', error);
      setHasError(true);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = (error: any) => {
    console.warn('SmartImage: Image failed to load:', error);
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  if (hasError || !imageSource) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <View style={styles.fallbackContent}>
          <Text style={styles.fallbackIcon}>{fallbackIcon}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      
      <Image
        source={{ uri: imageSource }}
        style={[styles.image, style]}
        contentFit={resizeMode as any}
        placeholder={placeholder}
        onLoad={handleImageLoad}
        onError={handleImageError}
        cachePolicy="memory-disk"
        transition={200} // Smooth fade-in effect
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  fallbackContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
});
