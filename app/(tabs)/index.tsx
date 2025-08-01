import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useColors, useRadius } from '@/contexts/ThemeContext';
import { FavoritesService } from '@/services/FavoritesService';
import { RecipeDatabase } from '@/services/recipeDatabase';
import { formatTimeAgo } from '@/utils/timeFormatter';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
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

	const colors = useColors();
	const radius = useRadius();

	// Use auth context instead of local state
	const { user } = useAuth();

	// Load recipe count on component mount and when URL modal closes
	const loadRecipeCount = async () => {
		try {
			const recipes = await RecipeDatabase.getAllRecipes();
			setRecipeCount(recipes.length);
		} catch (error) {
			console.error('Error loading recipe count:', error);
		}
	};

	const loadFavoriteCount = async () => {
		try {
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

	useEffect(() => {
		loadRecipeCount();
		loadFavoriteCount();
		loadRecentCount();
		loadLastRecipeTime();
	}, []);

	// Refresh data when screen comes into focus (e.g., returning from adding a recipe)
	useFocusEffect(
		useCallback(() => {
			loadRecipeCount();
			loadFavoriteCount();
			loadRecentCount();
			loadLastRecipeTime();
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
});
