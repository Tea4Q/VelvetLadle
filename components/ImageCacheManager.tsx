import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useColors, useSpacing, useTypography, useRadius } from '../contexts/ThemeContext';
import { ImageStorageService } from '../services/ImageStorageService';
import Button from './buttons';

interface ImageCacheManagerProps {
  onRefresh?: () => void;
}

/**
 * Image Cache Manager Component
 * 
 * Provides UI for managing locally cached recipe images
 */
export default function ImageCacheManager({ onRefresh }: ImageCacheManagerProps) {
  const [storageStats, setStorageStats] = useState({
    totalImages: 0,
    totalSize: 0,
    formattedSize: '0 B',
  });
  const [isLoading, setIsLoading] = useState(false);

  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  const radius = useRadius();

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      const stats = await ImageStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Image Cache',
      `This will delete all ${storageStats.totalImages} cached images (${storageStats.formattedSize}). Images will be re-downloaded when needed.\n\nAre you sure?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await ImageStorageService.clearAllImages();
              await loadStorageStats();
              onRefresh?.();
              Alert.alert('Success', 'Image cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRefreshStats = async () => {
    setIsLoading(true);
    try {
      await loadStorageStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginVertical: spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
          },
        ]}
      >
        📱 Local Image Storage
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              },
            ]}
          >
            Cached Images:
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.textPrimary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              },
            ]}
          >
            {storageStats.totalImages}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              },
            ]}
          >
            Storage Used:
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.textPrimary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              },
            ]}
          >
            {storageStats.formattedSize}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.description,
          {
            color: colors.textLight,
            fontSize: typography.fontSize.xs,
            marginTop: spacing.sm,
            marginBottom: spacing.lg,
          },
        ]}
      >
        Images are automatically cached locally for faster loading and offline viewing. 
        The cache is managed automatically but you can clear it if needed.
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          label="Refresh Stats"
          theme="outline"
          size="sm"
          onPress={handleRefreshStats}
          disabled={isLoading}
          icon="refresh"
        />

        <Button
          label="Clear Cache"
          theme="danger"
          size="sm"
          onPress={handleClearCache}
          disabled={isLoading || storageStats.totalImages === 0}
          icon="trash"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Dynamic styles applied inline
  },
  title: {
    // Dynamic styles applied inline
  },
  statsContainer: {
    // Dynamic styles applied inline
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    // Dynamic styles applied inline
  },
  statValue: {
    // Dynamic styles applied inline
  },
  description: {
    lineHeight: 18,
    // Dynamic styles applied inline
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
