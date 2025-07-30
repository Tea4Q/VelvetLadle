import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View, TextInput, ScrollView } from 'react-native';
import Button from './button';
import { Recipe, isSupabaseConfigured } from '../lib/supabase';
import { RecipeDatabase } from '../services/recipeDatabase';

type Props = {
	visible: boolean;
	onClose: () => void;
	initialUrl?: string;
};

export default function ManualRecipeModal({ visible, onClose, initialUrl }: Props) {
	const [title, setTitle] = useState('');
	const [ingredients, setIngredients] = useState('');
	const [directions, setDirections] = useState('');
	const [servings, setServings] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const resetForm = () => {
		setTitle('');
		setIngredients('');
		setDirections('');
		setServings('');
	};

	const handleSave = async () => {
		if (!title.trim()) {
			Alert.alert('Missing Information', 'Please enter a recipe title.');
			return;
		}

		if (!ingredients.trim()) {
			Alert.alert('Missing Information', 'Please enter at least one ingredient.');
			return;
		}

		if (!directions.trim()) {
			Alert.alert('Missing Information', 'Please enter cooking directions.');
			return;
		}

		setIsSaving(true);

		try {
			const recipe: Recipe = {
				title: title.trim(),
				ingredients: ingredients.split('\n').map(ing => ing.trim()).filter(ing => ing.length > 0),
				directions: directions.split('\n').map(dir => dir.trim()).filter(dir => dir.length > 0),
				servings: servings.trim() ? parseInt(servings.trim()) : undefined,
				web_address: initialUrl || 'manually-entered',
				description: 'Manually entered recipe'
			};

			const result = await RecipeDatabase.saveRecipe(recipe);

			if (result.success) {
				const storageType = isSupabaseConfigured ? 'Supabase database' : 'demo storage (temporary)';
				const setupNote = isSupabaseConfigured ? '' : '\n\n💡 Set up Supabase for permanent storage';
				
				Alert.alert(
					'Recipe Saved!',
					`Successfully saved "${recipe.title}" to ${storageType} with ${recipe.ingredients.length} ingredients and ${recipe.directions.length} steps.${setupNote}`,
					[{ text: 'OK', onPress: () => { resetForm(); onClose(); } }]
				);
			} else {
				Alert.alert('Save Failed', `Could not save the recipe: ${result.error}`);
			}
		} catch (error) {
			console.error('Error saving manual recipe:', error);
			Alert.alert('Error', 'An unexpected error occurred while saving the recipe.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		resetForm();
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
						<Text style={styles.modalTitle}>Add Recipe Manually</Text>
						<Text style={styles.subtitle}>Enter recipe details below</Text>

						<Text style={styles.label}>Recipe Title *</Text>
						<TextInput
							style={styles.textInput}
							placeholder="e.g., Classic Chicken Gizzards"
							value={title}
							onChangeText={setTitle}
							multiline={false}
						/>

						<Text style={styles.label}>Ingredients * (one per line)</Text>
						<TextInput
							style={[styles.textInput, styles.multilineInput]}
							placeholder={`1 lb chicken gizzards\n2 tbsp olive oil\n1 onion, diced\nSalt and pepper to taste`}
							value={ingredients}
							onChangeText={setIngredients}
							multiline={true}
							numberOfLines={6}
							textAlignVertical="top"
						/>

						<Text style={styles.label}>Directions * (one step per line)</Text>
						<TextInput
							style={[styles.textInput, styles.multilineInput]}
							placeholder={`Clean and trim gizzards\nHeat oil in large skillet\nSauté onions until golden\nAdd gizzards and cook until tender`}
							value={directions}
							onChangeText={setDirections}
							multiline={true}
							numberOfLines={6}
							textAlignVertical="top"
						/>

						<Text style={styles.label}>Servings (optional)</Text>
						<TextInput
							style={styles.textInput}
							placeholder="e.g., 4"
							value={servings}
							onChangeText={setServings}
							keyboardType="numeric"
							multiline={false}
						/>

						<View style={styles.buttonContainer}>
							<Button
								label={isSaving ? 'Saving...' : 'Save Recipe'}
								theme="primary"
								onPress={handleSave}
							/>
							<Button
								label="Cancel"
								onPress={handleCancel}
							/>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#faf4eb',
		borderRadius: 10,
		padding: 20,
		width: '90%',
		maxHeight: '80%',
		borderWidth: 2,
		borderColor: '#00205B',
	},
	scrollView: {
		width: '100%',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 5,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: '#00205B',
		marginBottom: 20,
		textAlign: 'center',
		opacity: 0.7,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#00205B',
		marginBottom: 5,
		marginTop: 10,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#00205B',
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
		fontSize: 14,
		backgroundColor: '#fff',
		color: '#00205B',
	},
	multilineInput: {
		minHeight: 100,
	},
	buttonContainer: {
		marginTop: 20,
		gap: 10,
	},
});
