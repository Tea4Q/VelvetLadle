import React, { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Linking,
	Modal,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { isSupabaseConfigured } from '../lib/supabase';
import { CorsProxyService } from '../services/corsProxyService';
import { FavoritesService } from '../services/FavoritesService';
import { RecipeDatabase } from '../services/recipeDatabase';
import { RecipeExtractor } from '../services/recipeExtractor';
import Button from './button';
import CircleButton from './circleButton';
import ManualRecipeModal from './ManualRecipeModal';
import ProcessButton from './processIconButton';

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

			// Use cross-platform dialog approach
			if (typeof window !== 'undefined') {
				// Web: Use window.alert
				window.alert(
					`Added to Favorites\n\n${title} has been added to your favorites!`
				);
			} else {
				// Mobile: Use React Native Alert
				Alert.alert(
					'Added to Favorites',
					`${title} has been added to your favorites!`,
					[{ text: 'OK' }]
				);
			}
			onClose();
		} catch (error) {
			console.error('Error adding to favorites:', error);

			// Use cross-platform dialog approach
			if (typeof window !== 'undefined') {
				// Web: Use window.alert
				window.alert('Error\n\nFailed to add URL to favorites');
			} else {
				// Mobile: Use React Native Alert
				Alert.alert('Error', 'Failed to add URL to favorites');
			}
		}
	};

	const openUrlInBrowser = () => {
		console.log('Attempting to open URL:', url);
		Linking.openURL(url)
			.then(() => console.log('URL opened successfully'))
			.catch((error) => {
				console.error('Failed to open URL:', error);

				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(
						'Error\n\nCould not open URL. Please check the URL and try again.'
					);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert(
						'Error',
						'Could not open URL. Please check the URL and try again.'
					);
				}
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
				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(
						'Invalid URL\n\nThe URL format is not valid. Please check the URL and try again.'
					);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert(
						'Invalid URL',
						'The URL format is not valid. Please check the URL and try again.',
						[{ text: 'OK' }]
					);
				}
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
					errorMessage += `This is due to CORS restrictions (website blocks browser access).\n\nAlternatives:\n${alternatives
						.map((alt) => `• ${alt}`)
						.join('\n')}`;

					// Use cross-platform dialog approach
					if (typeof window !== 'undefined') {
						// Web: Use window.confirm
						const userWantsManualEntry = window.confirm(
							`Network Error\n\n${errorMessage}\n\nWould you like to enter the recipe manually?`
						);
						if (userWantsManualEntry) {
							setIsProcessing(false);
							setShowManualEntry(true);
						}
					} else {
						// Mobile: Use React Native Alert
						Alert.alert('Network Error', errorMessage, [
							{ text: 'OK' },
							{
								text: 'Enter Manually',
								onPress: () => {
									setIsProcessing(false);
									setShowManualEntry(true);
								},
							},
						]);
					}
					return;
				} else {
					errorMessage +=
						'This might be due to:\n\n• Network connectivity issues\n• Website requires authentication\n• Server temporarily unavailable\n\nTry opening the URL in your browser first, then copy the recipe content manually.';
				}

				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(`Network Error\n\n${errorMessage}`);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert('Network Error', errorMessage, [{ text: 'OK' }]);
				}
				setIsProcessing(false);
				return;
			}

			if (!RecipeExtractor.isRecipePage(url, html)) {
				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(
						'No Recipe Found\n\nThis webpage does not appear to contain a recipe. Please try a different URL from a recipe website like AllRecipes, Food Network, or Epicurious.'
					);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert(
						'No Recipe Found',
						'This webpage does not appear to contain a recipe. Please try a different URL from a recipe website like AllRecipes, Food Network, or Epicurious.',
						[{ text: 'OK' }]
					);
				}
				setIsProcessing(false);
				return;
			}

			// Check if recipe already exists in database
			const existingRecipe = await RecipeDatabase.getRecipeByUrl(url);
			if (existingRecipe) {
				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.confirm
					const message = `Recipe Already Saved\n\nThe recipe "${existingRecipe.title}" is already in your collection.\n\nWould you like to view the recipe?`;
					const userWantsToView = window.confirm(message);

					if (userWantsToView) {
						// TODO: Navigate to recipe detail view
						console.log('Navigate to recipe:', existingRecipe.id);
					}
				} else {
					// Mobile: Use React Native Alert
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
								},
							},
						]
					);
				}

				setIsProcessing(false);
				onClose();
				return;
			}

			// Extract recipe from the webpage
			console.log('Extracting recipe data...');
			const extractedRecipe = await RecipeExtractor.extractRecipeFromUrl(url);

			if (!extractedRecipe) {
				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(
						"Extraction Failed\n\nCould not extract recipe information from this webpage. The recipe might be in a format we don't support yet, or the page structure is too complex."
					);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert(
						'Extraction Failed',
						"Could not extract recipe information from this webpage. The recipe might be in a format we don't support yet, or the page structure is too complex.",
						[{ text: 'OK' }]
					);
				}
				setIsProcessing(false);
				return;
			}

			console.log('Recipe extracted:', extractedRecipe.title);

			// Save recipe to database
			const saveResult = await RecipeDatabase.saveRecipe(extractedRecipe);

			if (saveResult.success) {
				const storageType = isSupabaseConfigured
					? 'Supabase database'
					: 'demo storage (temporary)';
				const setupNote = isSupabaseConfigured
					? ''
					: '\n\n💡 Set up Supabase for permanent storage (see SUPABASE_SETUP.md)';

				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.confirm
					const message = `Recipe Saved!\n\nSuccessfully saved "${extractedRecipe.title}" to ${storageType} with ${extractedRecipe.ingredients.length} ingredients and ${extractedRecipe.directions.length} steps.${setupNote}\n\nWould you like to view the recipe?`;
					const userWantsToView = window.confirm(message);

					if (userWantsToView) {
						// TODO: Navigate to recipe detail view
						console.log('Navigate to saved recipe:', saveResult.data?.id);
					}
				} else {
					// Mobile: Use React Native Alert
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
								},
							},
						]
					);
				}
				onClose();
			} else {
				// Use cross-platform dialog approach
				if (typeof window !== 'undefined') {
					// Web: Use window.alert
					window.alert(
						`Save Failed\n\nCould not save the recipe to your collection: ${saveResult.error}`
					);
				} else {
					// Mobile: Use React Native Alert
					Alert.alert(
						'Save Failed',
						`Could not save the recipe to your collection: ${saveResult.error}`,
						[{ text: 'OK' }]
					);
				}
			}
		} catch (error) {
			console.error('Error processing recipe:', error);

			// Provide specific error messages based on error type
			let errorTitle = 'Processing Error';
			let errorMessage =
				'An unexpected error occurred while processing the recipe.';

			if (error instanceof Error) {
				if (
					error.message.includes('timeout') ||
					error.message.includes('Timeout')
				) {
					errorTitle = 'Request Timeout';
					errorMessage =
						'The website took too long to respond. This often happens with slow-loading recipe sites.\n\n' +
						'🔄 Try again in a moment\n' +
						'📝 Or use "Enter Manually" to add the recipe yourself\n' +
						'💡 Some sites block automated access';
				} else if (
					error.message.includes('network') ||
					error.message.includes('fetch')
				) {
					errorTitle = 'Connection Error';
					errorMessage =
						'Unable to connect to the website. Please check your internet connection and try again.';
				} else if (
					error.message.includes('CORS') ||
					error.message.includes('blocked')
				) {
					errorTitle = 'Access Blocked';
					errorMessage =
						'This website blocks automated access.\n\n' +
						'📝 Use "Enter Manually" to add the recipe\n' +
						'📱 Mobile apps have better access than web browsers';
				}
			}

			// Use cross-platform dialog approach
			if (typeof window !== 'undefined') {
				// Web: Use window.confirm
				const userWantsManualEntry = window.confirm(
					`${errorTitle}\n\n${errorMessage}\n\nWould you like to enter the recipe manually?`
				);
				if (userWantsManualEntry) {
					// TODO: Open manual entry form
					console.log('Open manual recipe entry');
				}
			} else {
				// Mobile: Use React Native Alert
				Alert.alert(errorTitle, errorMessage, [
					{ text: 'OK' },
					{
						text: 'Enter Manually',
						onPress: () => {
							// TODO: Open manual entry form
							console.log('Open manual recipe entry');
						},
					},
				]);
			}
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
					<Text style={styles.modalTitle}>Recipe Website Ready</Text>
					<Text style={styles.modalText}>Website: {url}</Text>

					<View style={styles.modalButtons}>
						<View style={styles.actionButtonsRow}>
							<CircleButton
								icon='globe'
								label='Open Website'
								onPress={openUrlInBrowser}
							/>
							<CircleButton
								icon='star'
								label='Add to Favorites'
								onPress={addToFavorites}
							/>
							<View style={styles.processButtonContainer}>
								{isProcessing && (
									<ActivityIndicator
										size='small'
										color='#faf4eb'
										style={styles.loadingIndicator}
									/>
								)}
								<ProcessButton
									icon={isProcessing ? 'spinner' : 'cog'}
									label={isProcessing ? 'Processing...' : 'Process Recipe'}
									onPress={processRecipe}
								/>
							</View>
						</View>
						<Button label='Cancel' onPress={onClose} />
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
