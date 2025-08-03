import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useColors, useRadius } from '@/contexts/ThemeContext';
import { Recipe } from '@/lib/supabase';
import { FavoritesService } from '@/services/FavoritesService';
import { RecipeDatabase } from '@/services/recipeDatabase';
import { DemoStorage } from '@/services/demoStorage';
import { DemoFavorites } from '@/utils/demoFavorites';
import { formatTimeAgo } from '@/utils/timeFormatter';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

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

	// Load recipe count on component mount and when URL modal closes
	const loadRecipeCount = async () => {
		try {
			// Create demo recipes if needed (only for demo purposes)
			await DemoStorage.createDemoRecipesWithCategories();
			
			const recipes = await RecipeDatabase.getAllRecipes();
			setRecipeCount(recipes.length);
		} catch (error) {
			console.error('Error loading recipe count:', error);
		}
	};

	const loadFavoriteCount = async () => {
		try {
			// Create demo favorites if needed (only runs once if no favorites exist)
			await DemoFavorites.createDemoFavoritesIfNeeded();
			
			const favorites = await FavoritesService.getFavoriteRecipes();
			setFavoriteCount(favorites.length);
		} catch (error) {
			console.error('Error loading favorite count:', error);
		}
	};

	const loadRecentCount = async () => {
		try {
			const recent = await RecipeDatabase.getRecentRecipes();
			setRecentCount(recent.length);
		} catch (error) {
			console.error('Error loading recent count:', error);
		}
	};

	const loadLastRecipeTime = async () => {
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
	};

	const loadCategoryRecipes = async () => {
		try {
			// Define popular categories with emojis
			const categories = [
				{ key: 'italian', name: 'Italian', emoji: '🍝' },
				{ key: 'mexican', name: 'Mexican', emoji: '🌮' },
				{ key: 'asian', name: 'Asian', emoji: '🥢' },
				{ key: 'american', name: 'American', emoji: '🍔' },
				{ key: 'mediterranean', name: 'Mediterranean', emoji: '🫒' },
				{ key: 'indian', name: 'Indian', emoji: '🍛' }
			];

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
	};

	useEffect(() => {
		loadRecipeCount();
		loadFavoriteCount();
		loadRecentCount();
		loadLastRecipeTime();
		loadCategoryRecipes();
	}, []);

	// Refresh data when screen comes into focus (e.g., returning from adding a recipe)
	useFocusEffect(
		useCallback(() => {
			loadRecipeCount();
			loadFavoriteCount();
			loadRecentCount();
			loadLastRecipeTime();
			loadCategoryRecipes();
		}, [])
	);

	// Navigation handlers for stats cards
	const handleNavigateToRecipes = () => {
		router.push('/(tabs)/recipes');
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
						<FontAwesome6
							name='plus-circle'
							size={32}
							color={colors.textInverse}
							style={styles.quickActionsLinkIcon}
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
							{[
								{ key: 'italian', name: 'Italian', emoji: '🍝' },
								{ key: 'mexican', name: 'Mexican', emoji: '🌮' },
								{ key: 'asian', name: 'Asian', emoji: '🥢' },
								{ key: 'american', name: 'American', emoji: '🍔' },
								{ key: 'mediterranean', name: 'Mediterranean', emoji: '🫒' },
								{ key: 'indian', name: 'Indian', emoji: '🍛' }
							].map((category) => {
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
	// Legacy styles for compatibility
	text: {
		color: '#00205B',
		fontFamily: 'Nunito',
		fontSize: 20,
		fontWeight: 'bold',
	},
	container: {
		flex: 1,
		backgroundColor: '#faf4eb',
	},
	button: {
		backgroundColor: '#00205B',
		padding: 5,
		borderRadius: 5,
		marginTop: 20,
		textAlign: 'center',
		textDecorationLine: 'underline',
		width: '10%',
		fontWeight: 'bold',
	},
	imageContainer: {
		flex: 1,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#00205B',
		borderRadius: 8,
		padding: 12,
		marginBottom: 15,
		width: '100%',
		fontSize: 16,
		backgroundColor: '#fff',
	},

	// Main app styles
	mainContainer: {
		flexGrow: 1,
		padding: 20,
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
	quickActionsSection: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	quickActionsGrid: {
		flexDirection: 'row',
		gap: 16,
	},
	quickActionCard: {
		flex: 1,
		padding: 24,
		alignItems: 'center',
		gap: 12,
	},
	quickActionIcon: {
		marginBottom: 4,
	},
	quickActionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	quickActionSubtitle: {
		fontSize: 12,
		textAlign: 'center',
		opacity: 0.9,
	},
	urlInputSection: {
		padding: 24,
		marginBottom: 32,
	},
	inputSectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		textAlign: 'center',
	},
	urlInputContainer: {
		gap: 16,
	},
	modernTextInput: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
	},
	urlInputButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	recentSection: {
		marginBottom: 24,
	},
	recentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},
	recentText: {
		fontSize: 14,
		flex: 1,
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
});
