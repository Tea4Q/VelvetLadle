import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Recipe } from '../lib/supabase';
import { FavoritesService } from '../services/FavoritesService';

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
						label="← Back"
						onPress={onBack}
					/>
				)}
				<View style={styles.headerRight}>
					<Button
						label={isFavorited ? "⭐ Favorited" : "☆ Add to Favorites"}
						theme={isFavorited ? "secondary" : "outline"}
						onPress={handleToggleFavorite}
						disabled={loading}
					/>
					{onEdit && (
						<Button
							label="Edit"
							onPress={() => onEdit(recipe)}
						/>
					)}
				</View>
			</View>

			{/* Recipe Title */}
			<Text style={styles.title}>{recipe.title}</Text>

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
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Ingredients ({recipe.ingredients.length})</Text>
				{recipe.ingredients.map((ingredient, index) => (
					<View key={index} style={styles.listItem}>
						<Text style={styles.bullet}>•</Text>
						<Text style={styles.listText}>{ingredient}</Text>
					</View>
				))}
			</View>

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

			{/* Nutritional Info */}
			{recipe.nutritional_info && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Nutritional Information</Text>
					<View style={styles.nutritionGrid}>
						{Object.entries(recipe.nutritional_info).map(([key, value]) => (
							<View key={key} style={styles.nutritionItem}>
								<Text style={styles.nutritionLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
								<Text style={styles.nutritionValue}>{value}</Text>
							</View>
						))}
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
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	headerRight: {
		flexDirection: 'row',
		gap: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 20,
		textAlign: 'center',
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
	},
	nutritionItem: {
		backgroundColor: '#faf4eb',
		borderRadius: 8,
		padding: 10,
		minWidth: '45%',
		alignItems: 'center',
	},
	nutritionLabel: {
		fontSize: 12,
		color: '#00205B',
		opacity: 0.7,
		marginBottom: 5,
		textAlign: 'center',
	},
	nutritionValue: {
		fontSize: 14,
		color: '#00205B',
		fontWeight: 'bold',
		textAlign: 'center',
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
