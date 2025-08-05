import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useColors, useSpacing, useTypography, useRadius } from '../contexts/ThemeContext';
import { ImageStorageService } from '../services/ImageStorageService';
import { RecipeDatabase } from '../services/recipeDatabase';
import { Recipe } from '../lib/supabase';
import Button from './buttons';
import SmartImage from './SmartImage';

/**
 * Image Loading Test Component
 * 
 * This component provides a comprehensive test interface for the local image storage system.
 * It allows testing various image loading scenarios and monitoring performance.
 */
export default function ImageLoadTest() {
  const [testRecipes, setTestRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalImages: 0,
    totalSize: 0,
    formattedSize: '0 B',
  });

  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  const radius = useRadius();

  useEffect(() => {
    loadTestData();
    loadStorageStats();
  }, []);

  const loadTestData = async () => {
    try {
      // Get a few recipes for testing
      const recipes = await RecipeDatabase.getAllRecipes();
      const recipesWithImages = recipes.filter(recipe => recipe.image_url && recipe.id).slice(0, 3);
      setTestRecipes(recipesWithImages);
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await ImageStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testImageDownload = async () => {
    if (testRecipes.length === 0) {
      Alert.alert('No Test Data', 'No recipes with images found for testing');
      return;
    }

    setIsLoading(true);
    addTestResult('🧪 Starting image download test...');

    try {
      const recipe = testRecipes[0];
      addTestResult(`📡 Testing download for Recipe ID: ${recipe.id}`);
      
      const startTime = Date.now();
      const localPath = await ImageStorageService.downloadAndStoreImage(
        recipe.image_url!,
        recipe.id!
      );
      const downloadTime = Date.now() - startTime;

      if (localPath) {
        addTestResult(`✅ Download successful in ${downloadTime}ms`);
        addTestResult(`📁 Saved to: ${localPath.split('/').pop()}`);
      } else {
        addTestResult('❌ Download failed');
      }

      await loadStorageStats();
    } catch (error) {
      addTestResult(`❌ Download error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testImageRetrieval = async () => {
    if (testRecipes.length === 0) {
      Alert.alert('No Test Data', 'No recipes with images found for testing');
      return;
    }

    setIsLoading(true);
    addTestResult('🔍 Starting image retrieval test...');

    try {
      const recipe = testRecipes[0];
      addTestResult(`🎯 Testing retrieval for Recipe ID: ${recipe.id}`);
      
      const startTime = Date.now();
      const imageSource = await ImageStorageService.getImageSource(
        recipe.image_url!,
        recipe.id!
      );
      const retrievalTime = Date.now() - startTime;

      if (imageSource) {
        const isLocal = imageSource.startsWith('file://');
        addTestResult(`✅ Retrieved in ${retrievalTime}ms`);
        addTestResult(`📍 Source: ${isLocal ? 'Local cache' : 'Remote URL'}`);
      } else {
        addTestResult('❌ Retrieval failed');
      }
    } catch (error) {
      addTestResult(`❌ Retrieval error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPreloadImages = async () => {
    if (testRecipes.length === 0) {
      Alert.alert('No Test Data', 'No recipes with images found for testing');
      return;
    }

    setIsLoading(true);
    addTestResult('🚀 Starting preload test...');

    try {
      const startTime = Date.now();
      await ImageStorageService.preloadImages(testRecipes);
      const preloadTime = Date.now() - startTime;

      addTestResult(`✅ Preloaded ${testRecipes.length} images in ${preloadTime}ms`);
      await loadStorageStats();
    } catch (error) {
      addTestResult(`❌ Preload error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCacheClear = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all cached images. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            addTestResult('🧹 Clearing image cache...');

            try {
              await ImageStorageService.clearAllImages();
              addTestResult('✅ Cache cleared successfully');
              await loadStorageStats();
            } catch (error) {
              addTestResult(`❌ Clear error: ${error}`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const testImageInit = async () => {
    setIsLoading(true);
    addTestResult('🏗️ Testing storage initialization...');

    try {
      await ImageStorageService.initializeStorage();
      addTestResult('✅ Storage initialized successfully');
      await loadStorageStats();
    } catch (error) {
      addTestResult(`❌ Init error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, margin: spacing.md }]}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold }]}>
          🧪 Image Storage Test Lab
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.fontSize.sm, marginBottom: spacing.lg }]}>
          Test and monitor the local image storage system
        </Text>

        {/* Storage Statistics */}
        <View style={[styles.statsCard, { backgroundColor: colors.primary + '10', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }]}>
          <Text style={[styles.statsTitle, { color: colors.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium }]}>
            📊 Storage Statistics
          </Text>
          <Text style={[styles.statsText, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
            Cached Images: {storageStats.totalImages}
          </Text>
          <Text style={[styles.statsText, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
            Storage Used: {storageStats.formattedSize}
          </Text>
          <Text style={[styles.statsText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
            Test Recipes Available: {testRecipes.length}
          </Text>
        </View>

        {/* Test Controls */}
        <View style={styles.testControls}>
          <View style={styles.buttonRow}>
            <Button
              label="Initialize"
              theme="primary"
              size="sm"
              onPress={testImageInit}
              disabled={isLoading}
              icon="cog"
            />
            <Button
              label="Download Test"
              theme="secondary"
              size="sm"
              onPress={testImageDownload}
              disabled={isLoading || testRecipes.length === 0}
              icon="download"
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              label="Retrieval Test"
              theme="outline"
              size="sm"
              onPress={testImageRetrieval}
              disabled={isLoading || testRecipes.length === 0}
              icon="search"
            />
            <Button
              label="Preload Test"
              theme="outline"
              size="sm"
              onPress={testPreloadImages}
              disabled={isLoading || testRecipes.length === 0}
              icon="rocket"
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              label="Refresh Stats"
              theme="outline"
              size="sm"
              onPress={loadStorageStats}
              disabled={isLoading}
              icon="refresh"
            />
            <Button
              label="Clear Cache"
              theme="danger"
              size="sm"
              onPress={testCacheClear}
              disabled={isLoading}
              icon="trash"
            />
          </View>
        </View>

        {/* Test Results Log */}
        <View style={[styles.logCard, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
          <Text style={[styles.logTitle, { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginBottom: spacing.sm }]}>
            📋 Test Results Log
          </Text>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {testResults.length === 0 ? (
              <Text style={[styles.emptyLog, { color: colors.textLight, fontSize: typography.fontSize.sm }]}>
                No test results yet. Run a test to see logs here.
              </Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={[styles.logEntry, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  {result}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* Test Images Display */}
        {testRecipes.length > 0 && (
          <View style={[styles.imagesCard, { backgroundColor: colors.accent + '10', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
            <Text style={[styles.imagesTitle, { color: colors.accent, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginBottom: spacing.sm }]}>
              🖼️ Test Images Preview
            </Text>
            <View style={styles.imagesGrid}>
              {testRecipes.slice(0, 3).map((recipe, index) => (
                <View key={recipe.id} style={styles.imagePreview}>
                  <SmartImage
                    imageUrl={recipe.image_url}
                    recipeId={recipe.id!}
                    style={styles.previewImage}
                    resizeMode="cover"
                    fallbackIcon="🍽️"
                    onLoad={() => addTestResult(`🖼️ Image ${index + 1} loaded successfully`)}
                    onError={() => addTestResult(`❌ Image ${index + 1} failed to load`)}
                  />
                  <Text style={[styles.imageLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                    Recipe {recipe.id}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    // Dynamic styles applied inline
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    // Dynamic styles applied inline
  },
  statsTitle: {
    marginBottom: 8,
  },
  statsText: {
    marginBottom: 4,
  },
  testControls: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  logCard: {
    minHeight: 200,
    maxHeight: 300,
  },
  logTitle: {
    // Dynamic styles applied inline
  },
  logScroll: {
    flex: 1,
  },
  emptyLog: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  logEntry: {
    paddingVertical: 2,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  imagesCard: {
    // Dynamic styles applied inline
  },
  imagesTitle: {
    // Dynamic styles applied inline
  },
  imagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreview: {
    alignItems: 'center',
    width: 80,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
});
