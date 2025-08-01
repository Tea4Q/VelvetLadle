import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RecipeList from '../../components/RecipeList';
import RecipeViewer from '../../components/RecipeViewer';
import ManualRecipeModal from '../../components/ManualRecipeModal';
import { Recipe } from '../../lib/supabase';
import { useColors } from '../../contexts/ThemeContext';

export default function RecipesScreen() {
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const colors = useColors();

	const handleRecipeSelect = (recipe: Recipe) => {
		setSelectedRecipe(recipe);
	};

	const handleBack = () => {
		setSelectedRecipe(null);
	};

	const handleEdit = (recipe: Recipe) => {
		setEditingRecipe(recipe);
		setShowEditModal(true);
	};

	const handleEditModalClose = () => {
		setShowEditModal(false);
		setEditingRecipe(null);
	};

	const handleRecipeUpdated = () => {
		// Refresh the recipe list by incrementing the refresh key
		setRefreshKey(prev => prev + 1);
		// If we're viewing the edited recipe, update the selected recipe
		if (selectedRecipe && editingRecipe && selectedRecipe.id === editingRecipe.id) {
			setSelectedRecipe(null);
		}
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
					key={refreshKey} // This will trigger a refresh when the key changes
					onRecipeSelect={handleRecipeSelect}
				/>
			)}
			
			<ManualRecipeModal
				visible={showEditModal}
				onClose={handleEditModalClose}
				editingRecipe={editingRecipe}
				onRecipeUpdated={handleRecipeUpdated}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
