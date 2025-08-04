import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors, useElevation, useRadius, useSpacing, useTypography } from '../contexts/ThemeContext';
import { Favorite, Recipe } from '../lib/supabase';
import { FavoritesService } from '../services/FavoritesService';
import Button from './buttons';

type Props = {
  onRecipeSelect?: (recipe: Recipe) => void;
  onUrlOpen?: (url: string) => void;
  refreshTrigger?: number;
};

export default function FavoritesList({ onRecipeSelect, onUrlOpen, refreshTrigger }: Props) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recipes' | 'urls'>('all');
  
  // Use theme
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const typography = useTypography();
  const elevation = useElevation();

  const loadFavorites = useCallback(async () => {
    try {
      console.log('Loading favorites...');
      const [allFavorites, recipes] = await Promise.all([
        FavoritesService.getAllFavorites(),
        FavoritesService.getFavoriteRecipes()
      ]);
      
      setFavorites(allFavorites);
      setFavoriteRecipes(recipes);
      console.log(`Loaded ${allFavorites.length} favorites and ${recipes.length} favorite recipes`);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = async (favorite: Favorite) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${favorite.title}" from favorites?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (favorite.type === 'recipe' && favorite.recipe_id) {
                await FavoritesService.removeRecipeFromFavorites(favorite.recipe_id);
              } else if (favorite.type === 'url' && favorite.url) {
                await FavoritesService.removeUrlFromFavorites(favorite.url);
              }
              await loadFavorites(); // Reload the list
              Alert.alert('Success', 'Removed from favorites');
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove favorite');
            }
          },
        },
      ]
    );
  };

  const handleShareFavorite = async (favorite: Favorite) => {
    try {
      const url = favorite.type === 'recipe' ? 
        favoriteRecipes.find(r => r.id === favorite.recipe_id)?.web_address :
        favorite.url;
        
      if (url) {
        await Share.share({
          message: `Check out this ${favorite.type}: ${favorite.title}\n${url}`,
          url: url,
          title: favorite.title
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleItemPress = (favorite: Favorite) => {
    if (favorite.type === 'recipe' && favorite.recipe_id) {
      const recipe = favoriteRecipes.find(r => r.id === favorite.recipe_id);
      if (recipe && onRecipeSelect) {
        onRecipeSelect(recipe);
      }
    } else if (favorite.type === 'url' && favorite.url && onUrlOpen) {
      onUrlOpen(favorite.url);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      handleRefresh();
    }
  }, [refreshTrigger, handleRefresh]);

  const getDisplayData = () => {
    switch (activeTab) {
      case 'recipes':
        return favorites.filter(f => f.type === 'recipe');
      case 'urls':
        return favorites.filter(f => f.type === 'url');
      default:
        return favorites;
    }
  };

  const renderFavorite = ({ item: favorite }: { item: Favorite }) => (
    <TouchableOpacity
      style={[
        styles.favoriteCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.sm,
          ...elevation.md,
        },
      ]}
      onPress={() => handleItemPress(favorite)}
    >
      <View style={styles.favoriteHeader}>
        <View style={styles.favoriteInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.favoriteTitle,
                {
                  color: colors.textPrimary,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  flex: 1,
                },
              ]}
            >
              {favorite.title}
            </Text>
            
            <View style={[
              styles.typeTag,
              {
                backgroundColor: favorite.type === 'recipe' ? colors.primary : colors.accent,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                marginLeft: spacing.sm,
              }
            ]}>
              <Text style={[
                styles.typeText,
                {
                  color: colors.textInverse,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                }
              ]}>
                {favorite.type === 'recipe' ? '🍽️ Recipe' : '🔗 URL'}
              </Text>
            </View>
          </View>

          {favorite.description && (
            <Text
              style={[
                styles.favoriteDescription,
                {
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  marginTop: spacing.xs,
                },
              ]}
              numberOfLines={2}
            >
              {favorite.description}
            </Text>
          )}

          {favorite.notes && (
            <Text
              style={[
                styles.favoriteNotes,
                {
                  color: colors.textLight,
                  fontSize: typography.fontSize.sm,
                  marginTop: spacing.sm,
                  fontStyle: 'italic',
                },
              ]}
              numberOfLines={2}
            >
              💭 {favorite.notes}
            </Text>
          )}

          {favorite.tags && favorite.tags.length > 0 && (
            <View style={[styles.tagsContainer, { marginTop: spacing.sm }]}>
              {favorite.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.borderLight,
                      borderWidth: 1,
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      marginRight: spacing.xs,
                    }
                  ]}
                >
                  <Text style={[
                    styles.tagText,
                    {
                      color: colors.textSecondary,
                      fontSize: typography.fontSize.xs,
                    }
                  ]}>
                    #{tag}
                  </Text>
                </View>
              ))}
              {favorite.tags.length > 3 && (
                <Text style={[
                  styles.moreTagsText,
                  {
                    color: colors.textLight,
                    fontSize: typography.fontSize.xs,
                    marginLeft: spacing.xs,
                  }
                ]}>
                  +{favorite.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          {favorite.created_at && (
            <Text
              style={[
                styles.dateText,
                {
                  color: colors.textLight,
                  fontSize: typography.fontSize.xs,
                  marginTop: spacing.sm,
                },
              ]}
            >
              ⭐ Added {new Date(favorite.created_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.favoriteActions}>
          <TouchableOpacity
            style={[styles.actionButton, { padding: spacing.sm }]}
            onPress={() => handleShareFavorite(favorite)}
          >
            <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>📤</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { padding: spacing.sm }]}
            onPress={() => handleRemoveFavorite(favorite)}
          >
            <FontAwesome6 name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading favorites...
        </Text>
      </View>
    );
  }

  const displayData = getDisplayData();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { 
        paddingHorizontal: spacing.lg, 
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border 
      }]}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing.sm,
            },
          ]}
        >
          My Favorites ⭐
        </Text>
        
        <View style={styles.tabButtons}>
          {[
            { key: 'all', label: `All (${favorites.length})`, icon: '📋' },
            { key: 'recipes', label: `Recipes (${favorites.filter(f => f.type === 'recipe').length})`, icon: '🍽️' },
            { key: 'urls', label: `URLs (${favorites.filter(f => f.type === 'url').length})`, icon: '🔗' }
          ].map((tab) => (
            <Button
              key={tab.key}
              label={`${tab.icon} ${tab.label}`}
              theme={activeTab === tab.key ? 'primary' : 'outline'}
              onPress={() => setActiveTab(tab.key as any)}
            />
          ))}
        </View>
      </View>

      {displayData.length === 0 ? (
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.lg,
                textAlign: 'center',
                marginBottom: spacing.xl,
              },
            ]}
          >
            {activeTab === 'all' ? 'No favorites yet' : 
             activeTab === 'recipes' ? 'No favorite recipes' : 
             'No favorite URLs'}
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              {
                color: colors.textLight,
                fontSize: typography.fontSize.sm,
                textAlign: 'center',
                marginBottom: spacing.xl,
              },
            ]}
          >
            {activeTab === 'recipes' ? 
              'Tap the ⭐ icon on any recipe to add it to favorites' :
              'Add URLs to favorites for quick access to your favorite recipe sites'}
          </Text>
          <Button
            label="Refresh"
            theme="outline"
            onPress={handleRefresh}
            icon="refresh"
          />
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderFavorite}
          keyExtractor={(item) => `${item.type}-${item.id || item.url}`}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    // Dynamic styles applied inline
  },
  headerTitle: {
    // Dynamic styles applied inline
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyText: {
    // Dynamic styles applied inline
  },
  emptySubtext: {
    // Dynamic styles applied inline
  },
  favoriteCard: {
    // Dynamic styles applied inline
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  favoriteTitle: {
    // Dynamic styles applied inline
  },
  typeTag: {
    // Dynamic styles applied inline
  },
  typeText: {
    // Dynamic styles applied inline
  },
  favoriteDescription: {
    // Dynamic styles applied inline
  },
  favoriteNotes: {
    // Dynamic styles applied inline
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    // Dynamic styles applied inline
  },
  tagText: {
    // Dynamic styles applied inline
  },
  moreTagsText: {
    // Dynamic styles applied inline
  },
  dateText: {
    // Dynamic styles applied inline
  },
  favoriteActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    // Dynamic styles applied inline
  },
  actionIcon: {
    fontSize: 16,
  },
});
