import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert, Image } from 'react-native';
import { Recipe } from '../lib/supabase';
import { FavoritesService } from '../services/FavoritesService';
import IngredientList from './IngredientList';

import Button from './button';

type Props = {
	recipe: Recipe;
	onBack?: () => void;
	onEdit?: (recipe: Recipe) => void;
};

export default function RecipeViewer({ recipe, onBack, onEdit }: Props) {
	const [isFavorited, setIsFavorited] = useState(false);
	const [loading, setLoading] = useState(false);
	


	useEffect(() => {
		const checkFavoriteStatus = async () => {
			if (recipe.id) {
				const favorited = await FavoritesService.isRecipeFavorited(recipe.id);
				setIsFavorited(favorited);
			}
		};
		checkFavoriteStatus();
	}, [recipe.id]);

	const handleToggleFavorite = async () => {
		if (!recipe.id) return;
		
		setLoading(true);
		try {
			if (isFavorited) {
				await FavoritesService.removeRecipeFromFavorites(recipe.id);
				setIsFavorited(false);
				Alert.alert('Removed', 'Recipe removed from favorites');
			} else {
				await FavoritesService.addRecipeToFavorites(recipe);
				setIsFavorited(true);
				Alert.alert('Added', 'Recipe added to favorites');
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			Alert.alert('Error', 'Failed to update favorites');
		} finally {
			setLoading(false);
		}
	};
	const openWebAddress = async () => {
		if (recipe.web_address && recipe.web_address !== 'manually-entered') {
			try {
				const canOpen = await Linking.canOpenURL(recipe.web_address);
				if (canOpen) {
					await Linking.openURL(recipe.web_address);
				} else {
					Alert.alert('Error', 'Cannot open this URL');
				}
			} catch {
				Alert.alert('Error', 'Failed to open URL');
			}
		}
	};

	const formatTime = (time?: string) => {
		if (!time) return null;
		return time.replace(/PT|H|M/g, '').replace(/(\d+)(\d{2})/, '$1h $2m');
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			{/* Header */}
			<View style={styles.header}>
			
					{onBack && (
						<Button
							label="Back"
							onPress={onBack}
							theme="outline"
							size="sm"
						/>
					)}
			
		
					<Button
						label={isFavorited ? "⭐" : "☆"}
						theme={isFavorited ? "secondary" : "outline"}
						onPress={handleToggleFavorite}
						disabled={loading}
						size="sm"
					/>
					{onEdit && (
						<Button
							label="✏️"
							onPress={() => onEdit(recipe)}
							theme="outline"
							size="sm"
						/>
					)}
			</View>

			{/* Recipe Title */}
			<Text style={styles.title}>{recipe.title}</Text>

			{/* Recipe Image */}
			{recipe.image_url && (
				<View style={styles.imageContainer}>
					<Image
						source={{ uri: recipe.image_url }}
						style={styles.recipeImage}
						resizeMode="cover"
						onError={(error) => {
							console.log('Recipe image load error:', error.nativeEvent.error);
						}}
					/>
				</View>
			)}

			{/* Recipe Info */}
			<View style={styles.infoSection}>
				{recipe.description && (
					<Text style={styles.description}>{recipe.description}</Text>
				)}

				<View style={styles.infoGrid}>
					{recipe.servings && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Servings</Text>
							<Text style={styles.infoValue}>{recipe.servings}</Text>
						</View>
					)}
					{recipe.prep_time && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Prep Time</Text>
							<Text style={styles.infoValue}>{formatTime(recipe.prep_time) || recipe.prep_time}</Text>
						</View>
					)}
					{recipe.cook_time && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Cook Time</Text>
							<Text style={styles.infoValue}>{formatTime(recipe.cook_time) || recipe.cook_time}</Text>
						</View>
					)}
					{recipe.total_time && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Total Time</Text>
							<Text style={styles.infoValue}>{formatTime(recipe.total_time) || recipe.total_time}</Text>
						</View>
					)}
					{recipe.difficulty_level && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Difficulty</Text>
							<Text style={styles.infoValue}>{recipe.difficulty_level}</Text>
						</View>
					)}
					{recipe.cuisine_type && (
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Cuisine</Text>
							<Text style={styles.infoValue}>{recipe.cuisine_type}</Text>
						</View>
					)}
				</View>
			</View>

			{/* Ingredients */}
			<IngredientList 
				ingredients={recipe.ingredients}
				servings={recipe.servings}
				originalServings={recipe.servings}
			/>

			{/* Directions */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Directions ({recipe.directions.length} steps)</Text>
				{recipe.directions.map((direction, index) => (
					<View key={index} style={styles.directionItem}>
						<View style={styles.stepNumber}>
							<Text style={styles.stepNumberText}>{index + 1}</Text>
						</View>
						<Text style={styles.directionText}>{direction}</Text>
					</View>
				))}
			</View>

			{/* Nutritional Information */}
			{recipe.nutritional_info && Object.keys(recipe.nutritional_info).some(key => recipe.nutritional_info![key as keyof typeof recipe.nutritional_info]) && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>🥗 Nutritional Information</Text>
					<Text style={styles.nutritionDisclaimer}>Per serving • Approximate values</Text>
					
					<View style={styles.nutritionGrid}>
						{recipe.nutritional_info.calories && (
							<View style={[styles.nutritionItem, styles.caloriesItem]}>
								<Text style={styles.nutritionIcon}>🔥</Text>
								<Text style={styles.nutritionLabel}>Calories</Text>
								<Text style={[styles.nutritionValue, styles.caloriesValue]}>{recipe.nutritional_info.calories}</Text>
								<Text style={styles.nutritionUnit}>kcal</Text>
							</View>
						)}
						
						{recipe.nutritional_info.protein && (
							<View style={styles.nutritionItem}>
								<Text style={styles.nutritionIcon}>🥩</Text>
								<Text style={styles.nutritionLabel}>Protein</Text>
								<Text style={styles.nutritionValue}>{recipe.nutritional_info.protein}</Text>
							</View>
						)}
						
						{recipe.nutritional_info.carbs && (
							<View style={styles.nutritionItem}>
								<Text style={styles.nutritionIcon}>🍞</Text>
								<Text style={styles.nutritionLabel}>Carbs</Text>
								<Text style={styles.nutritionValue}>{recipe.nutritional_info.carbs}</Text>
							</View>
						)}
						
						{recipe.nutritional_info.fat && (
							<View style={styles.nutritionItem}>
								<Text style={styles.nutritionIcon}>🥑</Text>
								<Text style={styles.nutritionLabel}>Fat</Text>
								<Text style={styles.nutritionValue}>{recipe.nutritional_info.fat}</Text>
							</View>
						)}
						
						{recipe.nutritional_info.fiber && (
							<View style={styles.nutritionItem}>
								<Text style={styles.nutritionIcon}>🌾</Text>
								<Text style={styles.nutritionLabel}>Fiber</Text>
								<Text style={styles.nutritionValue}>{recipe.nutritional_info.fiber}</Text>
							</View>
						)}
						
						{recipe.nutritional_info.sugar && (
							<View style={styles.nutritionItem}>
								<Text style={styles.nutritionIcon}>🍯</Text>
								<Text style={styles.nutritionLabel}>Sugar</Text>
								<Text style={styles.nutritionValue}>{recipe.nutritional_info.sugar}</Text>
							</View>
						)}
					</View>
					
					{/* Nutritional Notes */}
					<View style={styles.nutritionNotes}>
						<Text style={styles.notesTitle}>💡 Nutrition Tips</Text>
						{recipe.nutritional_info.calories && (
							<Text style={styles.noteText}>
								• This recipe provides {Math.round((recipe.nutritional_info.calories / 2000) * 100)}% of daily calories (based on 2000 cal/day)
							</Text>
						)}
						{recipe.nutritional_info.protein && (
							<Text style={styles.noteText}>
								• Good source of protein for muscle health and satiety
							</Text>
						)}
						{recipe.nutritional_info.fiber && (
							<Text style={styles.noteText}>
								• Contains fiber for digestive health
							</Text>
						)}
					</View>
				</View>
			)}

			{/* Source */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Source</Text>
				{recipe.web_address === 'manually-entered' ? (
					<Text style={styles.sourceText}>✏️ Manually entered recipe</Text>
				) : (
					<Button
						label={`🌐 View Original Recipe`}
						onPress={openWebAddress}
						theme="primary"
					/>
				)}
			</View>

			{/* Metadata */}
			<View style={styles.metadata}>
				{recipe.created_at && (
					<Text style={styles.metadataText}>
						Added: {new Date(recipe.created_at).toLocaleDateString()}
					</Text>
				)}
				{recipe.updated_at && recipe.updated_at !== recipe.created_at && (
					<Text style={styles.metadataText}>
						Updated: {new Date(recipe.updated_at).toLocaleDateString()}
					</Text>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#faf4eb',
	},
	content: {
		padding: 20,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
		marginBottom: 20,
		minWidth: 60,
		paddingHorizontal: 5, // Add padding to prevent buttons from touching edges
		// minHeight: 36, // Reduced from 44 to match small button height
		flexWrap: 'wrap', // Allow wrapping on very small screens
		gap: 8, // Reduced gap for smaller buttons
	},
	
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 20,
		textAlign: 'center',
	},
	imageContainer: {
		marginBottom: 20,
		borderRadius: 15,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	recipeImage: {
		width: '100%',
		height: 250,
		backgroundColor: '#f0f0f0',
	},
	infoSection: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#00205B',
	},
	description: {
		fontSize: 16,
		color: '#00205B',
		marginBottom: 15,
		fontStyle: 'italic',
		textAlign: 'center',
	},
	infoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		justifyContent: 'center',
	},

	infoItem: {
		backgroundColor: '#faf4eb',
		borderRadius: 8,
		padding: 10,
		minWidth: '45%',
		alignItems: 'center',
	},
	infoLabel: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.7,
		marginBottom: 5,
		textTransform: 'uppercase',
		fontWeight: 'bold',
	},
	infoValue: {
		fontSize: 16,
		color: '#00205B',
		fontWeight: 'bold',
	},
	section: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#00205B',
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 15,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	bullet: {
		fontSize: 16,
		color: '#00205B',
		marginRight: 10,
		marginTop: 2,
	},
	listText: {
		fontSize: 16,
		color: '#00205B',
		flex: 1,
		lineHeight: 22,
	},
	directionItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 15,
	},
	stepNumber: {
		backgroundColor: '#00205B',
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 15,
		marginTop: 2,
	},
	stepNumberText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
	},
	directionText: {
		fontSize: 16,
		color: '#00205B',
		flex: 1,
		lineHeight: 22,
	},
	nutritionGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		justifyContent: 'center',
	},
	nutritionItem: {
		backgroundColor: '#faf4eb',
		borderRadius: 12,
		padding: 15,
		minWidth: '30%',
		maxWidth: '48%',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e8dcc0',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	caloriesItem: {
		backgroundColor: '#fff5f5',
		borderColor: '#fed7d7',
		minWidth: '48%',
	},
	nutritionIcon: {
		fontSize: 24,
		marginBottom: 8,
	},
	nutritionLabel: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.8,
		marginBottom: 5,
		textAlign: 'center',
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	nutritionValue: {
		fontSize: 18,
		color: '#00205B',
		fontWeight: 'bold',
		textAlign: 'center',
	},
	caloriesValue: {
		fontSize: 22,
		color: '#d53f8c',
	},
	nutritionUnit: {
		fontSize: 10,
		color: '#00205B',
		opacity: 0.6,
		marginTop: 2,
		textAlign: 'center',
	},
	nutritionDisclaimer: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.6,
		textAlign: 'center',
		marginBottom: 15,
		fontStyle: 'italic',
	},
	nutritionNotes: {
		backgroundColor: '#f0f8ff',
		borderRadius: 8,
		padding: 15,
		marginTop: 15,
		borderWidth: 1,
		borderColor: '#bee3f8',
	},
	notesTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 8,
	},
	noteText: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.8,
		lineHeight: 16,
		marginBottom: 4,
	},
	sourceText: {
		fontSize: 16,
		color: '#00205B',
		textAlign: 'center',
		fontStyle: 'italic',
	},
	metadata: {
		borderTopWidth: 1,
		borderTopColor: '#00205B',
		paddingTop: 15,
		marginTop: 10,
	},
	metadataText: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.6,
		textAlign: 'center',
		marginBottom: 5,
	},
});
