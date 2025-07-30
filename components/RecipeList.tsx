import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { RecipeDatabase } from '../services/recipeDatabase';
import { RecipeFilterService } from '../services/RecipeFilterService';
import { FavoritesService } from '../services/FavoritesService';
import RecipeSearchFilter from './RecipeSearchFilter';
import { Recipe } from '../lib/supabase';
import { useColors, useSpacing, useRadius, useTypography, useElevation } from '../contexts/ThemeContext';
import Button from './button';

type Props = {
	onRecipeSelect?: (recipe: Recipe) => void;
};

export default function RecipeList({ onRecipeSelect }: Props) {
	const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
	const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [favoriteStatuses, setFavoriteStatuses] = useState<{[key: number]: boolean}>({});
	
	// Use theme
	const colors = useColors();
	const spacing = useSpacing();
	const radius = useRadius();
	const typography = useTypography();
	const elevation = useElevation();

	const loadRecipes = async () => {
		try {
			console.log('Loading recipes...');
			const recipes = await RecipeDatabase.getAllRecipes();
			setAllRecipes(recipes);
			setFilteredRecipes(recipes);
			
			// Load favorite statuses
			const statuses: {[key: number]: boolean} = {};
			for (const recipe of recipes) {
				if (recipe.id) {
					statuses[recipe.id] = await FavoritesService.isRecipeFavorited(recipe.id);
				}
			}
			setFavoriteStatuses(statuses);
			
			console.log(`Loaded ${recipes.length} recipes:`, recipes.map(r => r.title));
		} catch (error) {
			console.error('Error loading recipes:', error);
			Alert.alert('Error', 'Failed to load recipes');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleToggleFavorite = async (recipe: Recipe) => {
		if (!recipe.id) return;
		
		try {
			const isFavorited = favoriteStatuses[recipe.id] || false;
			
			if (isFavorited) {
				await FavoritesService.removeRecipeFromFavorites(recipe.id);
				setFavoriteStatuses(prev => ({ ...prev, [recipe.id!]: false }));
				Alert.alert('Removed', 'Recipe removed from favorites');
			} else {
				await FavoritesService.addRecipeToFavorites(recipe);
				setFavoriteStatuses(prev => ({ ...prev, [recipe.id!]: true }));
				Alert.alert('Added', 'Recipe added to favorites');
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			Alert.alert('Error', 'Failed to update favorites');
		}
	};

	const handleSearch = (searchTerm: string, selectedIngredients: string[], selectedCuisines: string[]) => {
		const filtered = RecipeFilterService.filterRecipes(
			allRecipes,
			searchTerm,
			selectedIngredients,
			selectedCuisines
		);
		setFilteredRecipes(filtered);
	};

	const handleClearSearch = () => {
		setFilteredRecipes(allRecipes);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadRecipes();
	};

	const handleDelete = async (recipe: Recipe) => {
		Alert.alert(
			'Delete Recipe',
			`Are you sure you want to delete "${recipe.title}"?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await RecipeDatabase.deleteRecipe(recipe.id!);
							await loadRecipes(); // Reload the list
							Alert.alert('Success', 'Recipe deleted successfully');
						} catch (error) {
							console.error('Error deleting recipe:', error);
							Alert.alert('Error', 'Failed to delete recipe');
						}
					},
				},
			]
		);
	};

	useEffect(() => {
		loadRecipes();
	}, []);

	const availableIngredients = RecipeFilterService.extractIngredients(allRecipes);
	const availableCuisines = RecipeFilterService.extractCuisines(allRecipes);

	const renderRecipe = ({ item: recipe }: { item: Recipe }) => (
		<TouchableOpacity
			style={[
				styles.recipeCard,
				{
					backgroundColor: colors.surface,
					borderRadius: radius.lg,
					padding: spacing.lg,
					marginHorizontal: spacing.lg,
					marginVertical: spacing.sm,
					...elevation.md,
				},
			]}
			onPress={() => onRecipeSelect?.(recipe)}
		>
			<View style={styles.recipeHeader}>
				<Text
					style={[
						styles.recipeTitle,
						{
							color: colors.textPrimary,
							fontSize: typography.fontSize.lg,
							fontWeight: typography.fontWeight.bold,
							flex: 1,
						},
					]}
				>
					{recipe.title}
				</Text>
				
				<View style={styles.headerActions}>
					<TouchableOpacity
						onPress={() => handleToggleFavorite(recipe)}
						style={{ padding: spacing.xs, marginRight: spacing.sm }}
					>
						<Text style={{ 
							fontSize: 18, 
							color: favoriteStatuses[recipe.id!] ? colors.accent : colors.textLight 
						}}>
							{favoriteStatuses[recipe.id!] ? '⭐' : '☆'}
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity
						onPress={() => handleDelete(recipe)}
						style={{ padding: spacing.xs }}
					>
						<Text style={{ color: colors.error, fontSize: 16 }}>🗑️</Text>
					</TouchableOpacity>
				</View>
			</View>

			{recipe.description && (
				<Text
					style={[
						styles.recipeDescription,
						{
							color: colors.textSecondary,
							fontSize: typography.fontSize.sm,
							marginTop: spacing.xs,
							marginBottom: spacing.sm,
						},
					]}
					numberOfLines={2}
				>
					{recipe.description}
				</Text>
			)}

			<View style={styles.recipeDetails}>
				{recipe.cuisine_type && (
					<View style={[
						styles.cuisineTag,
						{
							backgroundColor: colors.accent,
							paddingHorizontal: spacing.sm,
							paddingVertical: spacing.xs,
							borderRadius: radius.full,
							marginRight: spacing.sm,
						}
					]}>
						<Text style={[
							styles.cuisineText,
							{
								color: colors.textInverse,
								fontSize: typography.fontSize.xs,
								fontWeight: typography.fontWeight.medium,
							}
						]}>
							{recipe.cuisine_type}
						</Text>
					</View>
				)}

				{recipe.total_time && (
					<Text
						style={[
							styles.timeText,
							{
								color: colors.textLight,
								fontSize: typography.fontSize.xs,
							},
						]}
					>
						⏰ {recipe.total_time}
					</Text>
				)}
			</View>

			{recipe.ingredients && recipe.ingredients.length > 0 && (
				<Text
					style={[
						styles.ingredientCount,
						{
							color: colors.textLight,
							fontSize: typography.fontSize.xs,
							marginTop: spacing.sm,
						},
					]}
				>
					🥕 {recipe.ingredients.length} ingredients
				</Text>
			)}
		</TouchableOpacity>
	);

	if (loading) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
				<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
					Loading recipes...
				</Text>
			</View>
		);
	}

	if (filteredRecipes.length === 0 && !showFilters) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
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
					No recipes found.
				</Text>
				<Button
					label="Refresh"
					theme="outline"
					onPress={handleRefresh}
					icon="refresh"
				/>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Filter Toggle Button */}
			<View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
				<Text
					style={[
						styles.headerTitle,
						{
							color: colors.textPrimary,
							fontSize: typography.fontSize.xl,
							fontWeight: typography.fontWeight.bold,
							flex: 1,
						},
					]}
				>
					My Recipes ({filteredRecipes.length})
				</Text>
				
				<Button
					label={showFilters ? "Hide Filters" : "Show Filters"}
					theme={showFilters ? "primary" : "outline"}
					onPress={() => setShowFilters(!showFilters)}
					icon={showFilters ? "filter-solid" : "filter"}
				/>
			</View>

			{/* Search and Filter Component */}
			{showFilters && (
				<RecipeSearchFilter
					onSearch={handleSearch}
					onClear={handleClearSearch}
					availableIngredients={availableIngredients}
					availableCuisines={availableCuisines}
				/>
			)}

			{/* Results Summary */}
			{showFilters && filteredRecipes.length !== allRecipes.length && (
				<View style={[styles.resultsHeader, { 
					paddingHorizontal: spacing.lg, 
					paddingVertical: spacing.sm,
					backgroundColor: colors.surface,
					marginHorizontal: spacing.lg,
					borderRadius: radius.md,
					marginBottom: spacing.sm
				}]}>
					<Text style={[styles.resultsText, { 
						color: colors.textSecondary,
						fontSize: typography.fontSize.sm 
					}]}>
						Showing {filteredRecipes.length} of {allRecipes.length} recipes
					</Text>
				</View>
			)}

			{filteredRecipes.length === 0 ? (
				<View style={[styles.centerContainer, { flex: 1 }]}>
					<Text style={[styles.noResultsText, {
						color: colors.textSecondary,
						fontSize: typography.fontSize.lg,
						textAlign: 'center',
						marginBottom: spacing.lg
					}]}>
						No recipes match your filters
					</Text>
					<Button
						label="Clear Filters"
						theme="outline"
						onPress={handleClearSearch}
						icon="times"
					/>
				</View>
			) : (
				<FlatList
					data={filteredRecipes}
					renderItem={renderRecipe}
					keyExtractor={(item) => item.id?.toString() || item.title}
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
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	headerTitle: {
		// Dynamic styles applied inline
	},
	resultsHeader: {
		// Dynamic styles applied inline
	},
	resultsText: {
		// Dynamic styles applied inline
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
	noResultsText: {
		// Dynamic styles applied inline
	},
	recipeCard: {
		// Dynamic styles applied inline
	},
	recipeHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	recipeTitle: {
		// Dynamic styles applied inline
	},
	recipeDescription: {
		// Dynamic styles applied inline
	},
	recipeDetails: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	cuisineTag: {
		// Dynamic styles applied inline
	},
	cuisineText: {
		// Dynamic styles applied inline
	},
	timeText: {
		// Dynamic styles applied inline
	},
	ingredientCount: {
		// Dynamic styles applied inline
	},
});
