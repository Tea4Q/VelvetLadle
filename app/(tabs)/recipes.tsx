import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RecipeList from '../../components/RecipeList';
import RecipeViewer from '../../components/RecipeViewer';
import { Recipe } from '../../lib/supabase';
import { useColors } from '../../contexts/ThemeContext';

export default function RecipesScreen() {
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const colors = useColors();

	const handleRecipeSelect = (recipe: Recipe) => {
		setSelectedRecipe(recipe);
	};

	const handleBack = () => {
		setSelectedRecipe(null);
	};

	const handleEdit = (recipe: Recipe) => {
		// TODO: Implement edit functionality
		console.log('Edit recipe:', recipe.title);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{selectedRecipe ? (
				<RecipeViewer
					recipe={selectedRecipe}
					onBack={handleBack}
					onEdit={handleEdit}
				/>
			) : (
				<RecipeList
					onRecipeSelect={handleRecipeSelect}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
