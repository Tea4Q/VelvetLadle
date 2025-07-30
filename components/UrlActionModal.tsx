import React, { useState } from 'react';
import { Alert, Linking, Modal, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Button from './button';
import CircleButton from './circleButton';
import ProcessButton from './processIconButton';
import ManualRecipeModal from './ManualRecipeModal';
import { RecipeExtractor } from '../services/recipeExtractor';
import { RecipeDatabase } from '../services/recipeDatabase';
import { FavoritesService } from '../services/FavoritesService';
import { isSupabaseConfigured } from '../lib/supabase';
import { CorsProxyService } from '../services/corsProxyService';

type Props = {
	visible: boolean;
	url: string;
	onClose: () => void;
};

export default function UrlActionModal({ visible, url, onClose }: Props) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showManualEntry, setShowManualEntry] = useState(false);

	const addToFavorites = async () => {
		try {
			// Extract domain name for title
			const urlObj = new URL(url);
			const domain = urlObj.hostname.replace('www.', '');
			const title = `Recipe from ${domain}`;
			
			await FavoritesService.addUrlToFavorites(
				url,
				title,
				`Saved from ${domain}`,
				undefined,
				['recipe-website']
			);
			
			Alert.alert(
				'Added to Favorites',
				`${title} has been added to your favorites!`,
				[{ text: 'OK' }]
			);
			onClose();
		} catch (error) {
			console.error('Error adding to favorites:', error);
			Alert.alert('Error', 'Failed to add URL to favorites');
		}
	};

	const openUrlInBrowser = () => {
		console.log('Attempting to open URL:', url);
		Linking.openURL(url)
			.then(() => console.log('URL opened successfully'))
			.catch((error) => {
				console.error('Failed to open URL:', error);
				Alert.alert(
					'Error',
					'Could not open URL. Please check the URL and try again.'
				);
			});
		onClose();
	};

	const processRecipe = async () => {
		console.log('Process Recipe pressed for URL:', url);
		setIsProcessing(true);
		
		try {
			// Validate URL format first
			try {
				new URL(url);
			} catch {
				Alert.alert(
					'Invalid URL', 
					'The URL format is not valid. Please check the URL and try again.',
					[{ text: 'OK' }]
				);
				setIsProcessing(false);
				return;
			}

			// First check if this URL contains a recipe
			console.log('Fetching webpage content...');
			let html;
			
			try {
				const response = await CorsProxyService.fetchWithCorsProxy(url);
				html = await response.text();
				console.log('Webpage content fetched successfully');
			} catch (fetchError) {
				console.error('Fetch error:', fetchError);
				
				let errorMessage = 'Cannot access the webpage. ';
				
				if (CorsProxyService.isCorsError(fetchError)) {
					const alternatives = CorsProxyService.getRecommendedAlternatives();
					errorMessage += `This is due to CORS restrictions (website blocks browser access).\n\nAlternatives:\n${alternatives.map(alt => `• ${alt}`).join('\n')}`;
					
					Alert.alert(
						'Network Error', 
						errorMessage, 
						[
							{ text: 'OK' },
							{ 
								text: 'Enter Manually', 
								onPress: () => {
									setIsProcessing(false);
									setShowManualEntry(true);
								}
							}
						]
					);
					return;
				} else {
					errorMessage += 'This might be due to:\n\n• Network connectivity issues\n• Website requires authentication\n• Server temporarily unavailable\n\nTry opening the URL in your browser first, then copy the recipe content manually.';
				}
				
				Alert.alert('Network Error', errorMessage, [{ text: 'OK' }]);
				setIsProcessing(false);
				return;
			}
			
			if (!RecipeExtractor.isRecipePage(url, html)) {
				Alert.alert(
					'No Recipe Found', 
					'This webpage does not appear to contain a recipe. Please try a different URL from a recipe website like AllRecipes, Food Network, or Epicurious.',
					[{ text: 'OK' }]
				);
				setIsProcessing(false);
				return;
			}
			
			// Check if recipe already exists in database
			const existingRecipe = await RecipeDatabase.getRecipeByUrl(url);
			if (existingRecipe) {
				Alert.alert(
					'Recipe Already Saved', 
					`The recipe "${existingRecipe.title}" is already in your collection.`,
					[
						{ text: 'OK' },
						{ 
							text: 'View Recipe', 
							onPress: () => {
								// TODO: Navigate to recipe detail view
								console.log('Navigate to recipe:', existingRecipe.id);
							}
						}
					]
				);
				setIsProcessing(false);
				onClose();
				return;
			}
			
			// Extract recipe from the webpage
			console.log('Extracting recipe data...');
			const extractedRecipe = await RecipeExtractor.extractRecipeFromUrl(url);
			
			if (!extractedRecipe) {
				Alert.alert(
					'Extraction Failed', 
					'Could not extract recipe information from this webpage. The recipe might be in a format we don\'t support yet, or the page structure is too complex.',
					[{ text: 'OK' }]
				);
				setIsProcessing(false);
				return;
			}
			
			console.log('Recipe extracted:', extractedRecipe.title);
			
			// Save recipe to database
			const saveResult = await RecipeDatabase.saveRecipe(extractedRecipe);
			
			if (saveResult.success) {
				const storageType = isSupabaseConfigured ? 'Supabase database' : 'demo storage (temporary)';
				const setupNote = isSupabaseConfigured ? '' : '\n\n💡 Set up Supabase for permanent storage (see SUPABASE_SETUP.md)';
				
				Alert.alert(
					'Recipe Saved!', 
					`Successfully saved "${extractedRecipe.title}" to ${storageType} with ${extractedRecipe.ingredients.length} ingredients and ${extractedRecipe.directions.length} steps.${setupNote}`,
					[
						{ text: 'OK' },
						{ 
							text: 'View Recipe', 
							onPress: () => {
								// TODO: Navigate to recipe detail view
								console.log('Navigate to saved recipe:', saveResult.data?.id);
							}
						}
					]
				);
				onClose();
			} else {
				Alert.alert(
					'Save Failed', 
					`Could not save the recipe to your collection: ${saveResult.error}`,
					[{ text: 'OK' }]
				);
			}
			
		} catch (error) {
			console.error('Error processing recipe:', error);
			Alert.alert(
				'Processing Error', 
				'An unexpected error occurred while processing the recipe. Please check your internet connection and try again.',
				[{ text: 'OK' }]
			);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType='slide'
			onRequestClose={onClose}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>Recipe URL Ready</Text>
					<Text style={styles.modalText}>URL: {url}</Text>

					<View style={styles.modalButtons}>
						<View style={styles.actionButtonsRow}>
							<CircleButton 
								label='Load Website' 
								onPress={openUrlInBrowser}
							/>
							<CircleButton 
								label='⭐ Add to Favorites' 
								onPress={addToFavorites}
							/>
							<View style={styles.processButtonContainer}>
								{isProcessing && <ActivityIndicator size="small" color="#faf4eb" style={styles.loadingIndicator} />}
								<ProcessButton
									icon={isProcessing ? 'clock-o' : 'cog'}
									label={isProcessing ? 'Processing...' : 'Process Recipe'}
									onPress={processRecipe}
								/>
							</View>
						</View>
						<Button 
							label='Cancel' 
							onPress={onClose}
						/>
					</View>
				</View>
			</View>
			
			<ManualRecipeModal
				visible={showManualEntry}
				onClose={() => setShowManualEntry(false)}
				initialUrl={url}
			/>
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
		width: '80%',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#00205B',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#00205B',
		marginBottom: 10,
		textAlign: 'center',
	},
	modalText: {
		fontSize: 16,
		color: '#00205B',
		marginBottom: 20,
		textAlign: 'center',
	},
	modalButtons: {
		width: '100%',
		gap: 20,
		alignItems: 'center',
	},
	actionButtonsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 20,
		paddingHorizontal: 30,
		gap: 40,
		width: '100%',
	},
	processButtonContainer: {
		position: 'relative',
		alignItems: 'center',
	},
	loadingIndicator: {
		position: 'absolute',
		top: -20,
		zIndex: 1,
	},
});
