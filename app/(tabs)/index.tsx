import { useAuth } from '@/contexts/AuthContext';
import { useColors, useRadius } from '@/contexts/ThemeContext';
import { Recipe } from '@/lib/supabase';
import { DemoStorage } from '@/services/demoStorage';
import { FavoritesService } from '@/services/FavoritesService';
import { RecipeDatabase } from '@/services/recipeDatabase';
import { DemoFavorites } from '@/utils/demoFavorites';
import { formatTimeAgo } from '@/utils/timeFormatter';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

export default function Index() {
	const [recipeCount, setRecipeCount] = useState<number>(0);
	const [favoriteCount, setFavoriteCount] = useState<number>(0);
	const [recentCount, setRecentCount] = useState<number>(0);
	const [lastRecipeTime, setLastRecipeTime] = useState<string>('');
	const [categoryRecipes, setCategoryRecipes] = useState<{ [key: string]: Recipe[] }>({});

	const colors = useColors();
	const radius = useRadius();

	// Use auth context instead of local state
	const { user } = useAuth();
	
	// Prevent multiple simultaneous loads
	const isLoadingRef = useRef(false);
	const demoDataInitialized = useRef(false);
	
	// Memoize categories to prevent unnecessary re-renders
	const categories = useMemo(() => [
		{ key: 'italian', name: 'Italian', emoji: '🍝' },
		{ key: 'mexican', name: 'Mexican', emoji: '🌮' },
		{ key: 'asian', name: 'Asian', emoji: '🥢' },
		{ key: 'american', name: 'American', emoji: '🍔' },
		{ key: 'mediterranean', name: 'Mediterranean', emoji: '🫒' },
		{ key: 'indian', name: 'Indian', emoji: '🍛' }
	], []);

	// Load recipe count on component mount and when URL modal closes
	const loadRecipeCount = useCallback(async () => {
		try {
			const recipes = await RecipeDatabase.getAllRecipes();
			setRecipeCount(recipes.length);
		} catch (error) {
			console.error('Error loading recipe count:', error);
		}
	}, []);

	const loadFavoriteCount = useCallback(async () => {
		try {
			const favorites = await FavoritesService.getFavoriteRecipes();
			setFavoriteCount(favorites.length);
		} catch (error) {
			console.error('Error loading favorite count:', error);
		}
	}, []);

	const loadRecentCount = useCallback(async () => {
		try {
			const recent = await RecipeDatabase.getRecentRecipes();
			setRecentCount(recent.length);
		} catch (error) {
			console.error('Error loading recent count:', error);
		}
	}, []);

	const loadLastRecipeTime = useCallback(async () => {
		try {
			const mostRecent = await RecipeDatabase.getMostRecentRecipe();
			if (mostRecent && mostRecent.created_at) {
				const timeAgo = formatTimeAgo(mostRecent.created_at);
				setLastRecipeTime(timeAgo);
			} else {
				setLastRecipeTime('');
			}
		} catch (error) {
			console.error('Error loading last recipe time:', error);
			setLastRecipeTime('');
		}
	}, []);

	const loadCategoryRecipes = useCallback(async () => {
		try {
			const categoryData: { [key: string]: Recipe[] } = {};
			
			for (const category of categories) {
				const recipes = await RecipeDatabase.getRecipesByCategory(category.key, 3);
				if (recipes.length > 0) {
					categoryData[category.key] = recipes;
				}
			}
			
			setCategoryRecipes(categoryData);
		} catch (error) {
			console.error('Error loading category recipes:', error);
		}
	}, [categories]);

	// Initialize demo data only once
	const initializeDemoData = useCallback(async () => {
		if (demoDataInitialized.current) {
			return;
		}
		
		try {
			console.log('Initializing demo data...');
			demoDataInitialized.current = true;
			
			// Create demo recipes and favorites only once
			await Promise.all([
				DemoStorage.createDemoRecipesWithCategories(),
				DemoFavorites.createDemoFavoritesIfNeeded()
			]);
			
			console.log('Demo data initialized successfully');
		} catch (error) {
			console.error('Error initializing demo data:', error);
			demoDataInitialized.current = false; // Reset on error
		}
	}, []);

	// Single function to load all data and prevent simultaneous calls
	const loadAllData = useCallback(async () => {
		if (isLoadingRef.current) {
			console.log('Data load already in progress, skipping...');
			return;
		}
		
		isLoadingRef.current = true;
		
		try {
			// Initialize demo data first, but only once
			await initializeDemoData();
			
			// Then load all the display data
			await Promise.all([
				loadRecipeCount(),
				loadFavoriteCount(),
				loadRecentCount(),
				loadLastRecipeTime(),
				loadCategoryRecipes()
			]);
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoadingRef.current = false;
		}
	}, [initializeDemoData, loadRecipeCount, loadFavoriteCount, loadRecentCount, loadLastRecipeTime, loadCategoryRecipes]);

	useEffect(() => {
		loadAllData();
	}, [loadAllData]);

	// Refresh data when screen comes into focus, but don't re-initialize demo data
	useFocusEffect(
		useCallback(() => {
			// Only load display data, not demo initialization
			if (isLoadingRef.current) {
				return;
			}
			
			isLoadingRef.current = true;
			
			Promise.all([
				loadRecipeCount(),
				loadFavoriteCount(),
				loadRecentCount(),
				loadLastRecipeTime(),
				loadCategoryRecipes()
			]).finally(() => {
				isLoadingRef.current = false;
			});
		}, [loadRecipeCount, loadFavoriteCount, loadRecentCount, loadLastRecipeTime, loadCategoryRecipes])
	);

	// Navigation handlers for stats cards
	const handleNavigateToRecipes = () => {
		// Clear any existing category filter by explicitly setting params to undefined
		router.push({
			pathname: '/(tabs)/recipes',
			params: { category: undefined }
		});
	};

	const handleNavigateToFavorites = () => {
		router.push('/(tabs)/favorites');
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.mainContainer}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View style={styles.headerSection}>
					<View style={styles.welcomeContainer}>
						<Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
							Welcome back, {user?.name || 'Chef'}! 👨‍🍳
						</Text>
						<Text style={[styles.welcomeSubtext, { color: colors.textLight }]}>
							These are the recipes you captured so far!
						</Text>
					</View>
					<Pressable
						style={[
							styles.profileButton,
							{ backgroundColor: colors.primaryLight },
						]}
					>
						<FontAwesome6 name='user' size={20} color={colors.primary} />
					</Pressable>
				</View>

				{/* Stats Cards */}
				<View style={styles.statsContainer}>
					<Pressable
						style={({ pressed }) => [
							styles.statCard,
							{ 
								backgroundColor: colors.surface, 
								borderRadius: radius.md,
								opacity: pressed ? 0.8 : 1,
								transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
							},
						]}
						onPress={handleNavigateToRecipes}
					>
						<FontAwesome6 name='bread-slice' size={24} color={colors.primary} />
						<Text style={[styles.statNumber, { color: colors.primary }]}>
							{recipeCount}
						</Text>
						<Text style={[styles.statLabel, { color: colors.textLight }]}>
							Recipe{recipeCount !== 1 ? 's' : ''}
						</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							styles.statCard,
							{ 
								backgroundColor: colors.surface, 
								borderRadius: radius.md,
								opacity: pressed ? 0.8 : 1,
								transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
							},
						]}
						onPress={handleNavigateToFavorites}
					>
						<FontAwesome6 name='star' size={24} color={colors.primary} />
						<Text style={[styles.statNumber, { color: colors.primary }]}>
							{favoriteCount}
						</Text>
						<Text style={[styles.statLabel, { color: colors.primary }]}>
							Favorites{favoriteCount !== 1 ? 's' : ''}
						</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							styles.statCard,
							{ 
								backgroundColor: colors.surface, 
								borderRadius: radius.md,
								opacity: pressed ? 0.8 : 1,
								transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
							},
						]}
						onPress={handleNavigateToRecipes}
					>
						<FontAwesome6
							name='cake-candles'
							size={24}
							color={colors.primary}
						/>
						<Text style={[styles.statNumber, { color: colors.primary }]}>
							{recentCount}
						</Text>
						<Text style={[styles.statLabel, { color: colors.textLight }]}>
							Recent{recentCount !== 1 ? 's' : ''}
						</Text>
					</Pressable>
				</View>

				{/* Quick Actions Link */}
				<View style={styles.quickActionsLinkSection}>
					<Pressable
						style={({ pressed }) => [
							styles.quickActionsLinkCard,
							{
								backgroundColor: colors.accent,
								borderRadius: radius.lg,
								opacity: pressed ? 0.9 : 1,
								transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
							},
						]}
						onPress={() => router.push('/(tabs)/add')}
					>
						<Image
							style={styles.quickActionsLinkIcon}
							source={require('@/assets/icons/recipesIcon.png')}
						/>
						<View style={styles.quickActionsLinkContent}>
							<Text style={[styles.quickActionsLinkTitle, { color: colors.textInverse }]}>
								What&apos;s cooking today?
							</Text>
							<Text style={[styles.quickActionsLinkSubtitle, { color: colors.textInverse }]}>
								Add a new recipe from web or image
							</Text>
						</View>
						<FontAwesome6
							name='chevron-right'
							size={20}
							color={colors.textInverse}
							style={styles.quickActionsLinkArrow}
						/>
					</Pressable>
				</View>

				{/* Quick Categories */}
				{Object.keys(categoryRecipes).length > 0 && (
					<View style={styles.categoriesSection}>
						<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
							Quick Categories 🍽️
						</Text>
						<ScrollView 
							horizontal 
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoriesScrollContainer}
						>
							{categories.map((category) => {
								const recipes = categoryRecipes[category.key];
								if (!recipes || recipes.length === 0) return null;
								
								return (
									<Pressable
										key={category.key}
										style={({ pressed }) => [
											styles.categoryCard,
											{
												backgroundColor: colors.surface,
												borderRadius: radius.lg,
												opacity: pressed ? 0.8 : 1,
												transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
											},
										]}
										onPress={() => router.push({
											pathname: '/(tabs)/recipes',
											params: { category: category.key }
										})}
									>
										<View style={styles.categoryHeader}>
											<Text style={styles.categoryEmoji}>{category.emoji}</Text>
											<Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>
												{category.name}
											</Text>
											<Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
												{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
											</Text>
										</View>
										
										<View style={styles.categoryRecipes}>
											{recipes.slice(0, 3).map((recipe, index) => (
												<View key={recipe.id || index} style={styles.categoryRecipeItem}>
													{recipe.image_url ? (
														<Image
															source={{ uri: recipe.image_url }}
															style={[styles.categoryRecipeImage, { borderRadius: radius.sm }]}
														/>
													) : (
														<View style={[
															styles.categoryRecipeImagePlaceholder,
															{ 
																backgroundColor: colors.border,
																borderRadius: radius.sm 
															}
														]}>
															<FontAwesome6 name="utensils" size={12} color={colors.textLight} />
														</View>
													)}
													<Text 
														style={[styles.categoryRecipeTitle, { color: colors.textPrimary }]}
														numberOfLines={2}
													>
														{recipe.title}
													</Text>
												</View>
											))}
										</View>
										
										<View style={styles.categoryFooter}>
											<Text style={[styles.viewMoreText, { color: colors.primary }]}>
												View All →
											</Text>
										</View>
									</Pressable>
								);
							}).filter(Boolean)}
						</ScrollView>
					</View>
				)}

				{/* Recent Activity */}
				<View style={styles.recentSection}>

					<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
						Recent Activity
					</Text>
					<View
						style={[
							styles.recentCard,
							{ backgroundColor: colors.surface, borderRadius: radius.md },
						]}
					>
						<FontAwesome6 name='clock' size={16} color={colors.textLight} />
						<Text style={[styles.recentText, { color: colors.textLight }]}>
							{recipeCount > 0 && lastRecipeTime
								? `Last recipe added ${lastRecipeTime}`
								: 'No recipes yet - add your first one!'}
						</Text>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#faf4eb',
	},
	
	// Main app styles
	mainContainer: {
		flexGrow: 1,
		padding: 20,
		paddingBottom: 80,
	},
	headerSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	welcomeContainer: {
		flex: 1,
	},
	welcomeText: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	welcomeSubtext: {
		fontSize: 16,
		opacity: 0.8,
	},
	profileButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},

	//Stats cards
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 32,
		gap: 12,
	},
	statCard: {
		flex: 1,
		padding: 20,
		alignItems: 'center',
		gap: 8,
	},
	statNumber: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	statLabel: {
		fontSize: 12,
		textAlign: 'center',
	},
	// Quick Actions Link
	quickActionsLinkSection: {
		marginBottom: 32,
	},
	quickActionsLinkCard: {
		flexDirection: 'row',
		padding: 24,
		alignItems: 'center',
		gap: 16,
	},
	quickActionsLinkIcon: {
		marginRight: 4,
		height: 32,
		width: 32,
	},
	quickActionsLinkContent: {
		flex: 1,
	},
	quickActionsLinkTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	quickActionsLinkSubtitle: {
		fontSize: 14,
		opacity: 0.9,
	},
	quickActionsLinkArrow: {
		marginLeft: 8,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
	},

	// Quick Categories styles
	categoriesSection: {
		marginBottom: 32,
	},
	categoriesScrollContainer: {
		paddingHorizontal: 20,
		gap: 16,
	},
	categoryCard: {
		width: 200,
		padding: 16,
		marginRight: 16,
	},
	categoryHeader: {
		alignItems: 'center',
		marginBottom: 12,
	},
	categoryEmoji: {
		fontSize: 32,
		marginBottom: 8,
	},
	categoryTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	categoryCount: {
		fontSize: 12,
	},
	categoryRecipes: {
		gap: 8,
		marginBottom: 12,
	},
	categoryRecipeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	categoryRecipeImage: {
		width: 24,
		height: 24,
	},
	categoryRecipeImagePlaceholder: {
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	categoryRecipeTitle: {
		flex: 1,
		fontSize: 11,
		lineHeight: 14,
	},
	categoryFooter: {
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
		paddingTop: 8,
	},
	viewMoreText: {
		fontSize: 12,
		fontWeight: '600',
	},

	// Recent Activity styles
	recentSection: {
		marginBottom: 40,
		paddingBottom: 20,
	},
	recentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 20,
		gap: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	recentText: {
		fontSize: 14,
		flex: 1,
	},
});
