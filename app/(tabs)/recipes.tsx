import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import RecipeForm from '../../components/RecipeForm';
import RecipeList from '../../components/RecipeList';
import RecipeViewer from '../../components/RecipeViewer';
import { useColors } from '../../contexts/ThemeContext';
import { Recipe } from '../../lib/supabase';
import { RecipeDatabase } from '../../services/recipeDatabase';

export default function RecipesScreen() {
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [showEditForm, setShowEditForm] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const colors = useColors();
	
	// Get URL parameters for category filtering and stabilize the value
	const { category } = useLocalSearchParams();
	const stableCategory = useMemo(() => category as string, [category]);

	const handleRecipeSelect = (recipe: Recipe) => {
		setSelectedRecipe(recipe);
	};

	const handleBack = () => {
		setSelectedRecipe(null);
	};

	const handleEdit = (recipe: Recipe) => {
		setEditingRecipe(recipe);
		setShowEditForm(true);
	};

	const handleEditFormClose = () => {
		setShowEditForm(false);
		setEditingRecipe(null);
	};



	const handleRecipeFormSave = async (updatedRecipe: Recipe) => {
		if (!updatedRecipe.id) {
			Alert.alert('Error', 'Recipe ID is missing.');
			return;
		}
		const { success, data, error } = await RecipeDatabase.updateRecipe(updatedRecipe.id, updatedRecipe);
		if (!success) {
			Alert.alert('Error updating recipe', error || 'Unknown error');
			return;
		}
		setShowEditForm(false);
		setEditingRecipe(null);
		setRefreshKey(prev => prev + 1);
		// If we're viewing the edited recipe, update the selected recipe
		if (selectedRecipe && data && data.id === selectedRecipe.id) {
			setSelectedRecipe(data);
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
					key={`recipes-list-${refreshKey}-${stableCategory || 'all'}`} // Include category in key to force re-render
					onRecipeSelect={handleRecipeSelect}
					initialCategoryFilter={stableCategory}
				/>
			)}
			
			{showEditForm && editingRecipe && (
				<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 10 }}>
					<RecipeForm
						initialRecipe={editingRecipe}
						onSave={handleRecipeFormSave}
						onCancel={handleEditFormClose}
					/>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
