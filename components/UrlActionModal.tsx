import { RecipeDatabase } from '@/services/recipeDatabase';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Linking,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Recipe, isSupabaseConfigured } from '../lib/supabase';
import { CorsProxyService } from '../services/corsProxyService';
import { FavoritesService } from '../services/FavoritesService';
import { RecipeExtractor } from '../services/recipeExtractor';
import Button from './buttons';
import CircleButton from './circleButton';
import ManualRecipeModal from './ManualRecipeModal';
import ProcessButton from './processIconButton';

type Props = {
	visible: boolean;
	url: string;
	onClose: () => void;
	onRecipeSelect?: (recipe: Recipe) => void;
};

export default function UrlActionModal({ visible, url, onClose, onRecipeSelect }: Props) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showManualEntry, setShowManualEntry] = useState(false);
	const [inputUrl, setInputUrl] = useState('');
	const [isUrlInputMode, setIsUrlInputMode] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [testRecipeSource, setTestRecipeSource] = useState<string>('');

	// Initialize URL input mode based on whether URL is provided
	React.useEffect(() => {
		if (visible) {
			if (!url || url.trim() === '') {
				setIsUrlInputMode(true);
				setInputUrl('');
			} else {
				setIsUrlInputMode(false);
				setInputUrl(url);
			}
		}
	}, [visible, url]);

	const handleUrlSubmit = () => {
		if (!inputUrl.trim()) {
			Alert.alert('Error', 'Please enter a valid URL');
			return;
		}

		// Basic URL validation and formatting
		let processedUrl = inputUrl.trim();
		if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
			processedUrl = 'https://' + processedUrl;
		}

		// Update the URL and exit input mode
		setInputUrl(processedUrl);
		setIsUrlInputMode(false);
	};

	const addToFavorites = async () => {
		const urlToUse = isUrlInputMode ? inputUrl : url;
		if (!urlToUse || !urlToUse.trim()) {
			Alert.alert('Error', 'Please enter a URL first');
			return;
		}

		try {
			// Extract domain name for title
			const urlObj = new URL(urlToUse);
			const domain = urlObj.hostname.replace('www.', '');
			const title = `Recipe from ${domain}`;

			await FavoritesService.addUrlToFavorites(
				url,
				title,
				`Saved from ${domain}`,
				undefined,
				['recipe-website']
			);

			// Use React Native Alert
			Alert.alert(
				'Added to Favorites',
				`${title} has been added to your favorites!`,
				[{ text: 'OK' }]
			);
			onClose();
		} catch (error) {
			console.error('Error adding to favorites:', error);

		// Use React Native Alert
		Alert.alert('Error', 'Failed to add URL to favorites');
	}
};	const openUrlInBrowser = () => {
		const urlToUse = isUrlInputMode ? inputUrl : (inputUrl || url);
		// Production build: console.log removed
		Linking.openURL(urlToUse)
			.then(() => {
				// URL opened successfully
			})
			.catch((error) => {
				console.error('Failed to open URL:', error);

				// Use React Native Alert
				Alert.alert(
					'Error',
					'Could not open URL. Please check the URL and try again.'
				);
			});
		onClose();
	};

	const processRecipe = async () => {
		const urlToUse = isUrlInputMode ? inputUrl : (inputUrl || url);
		// Production build: console.log removed
		setIsProcessing(true);

		try {
			// Validate URL format first
			try {
				new URL(urlToUse);
			} catch {
				// Use React Native Alert
				Alert.alert(
					'Invalid URL',
					'The URL format is not valid. Please check the URL and try again.',
					[{ text: 'OK' }]
				);
				setIsProcessing(false);
				return;
			}

			// First check if this URL contains a recipe
			// Production build: console.log removed
			let html;

			try {
				const response = await CorsProxyService.fetchWithCorsProxy(urlToUse);
				html = await response.text();
				// Production build: console.log removed
			} catch (fetchError) {
				console.error('Fetch error:', fetchError);

				let errorMessage = 'Cannot access the webpage. ';

				if (CorsProxyService.isCorsError(fetchError)) {
					const alternatives = CorsProxyService.getRecommendedAlternatives();
					errorMessage += `This is due to CORS restrictions (website blocks browser access).\n\nAlternatives:\n${alternatives
						.map((alt) => `• ${alt}`)
						.join('\n')}`;

					// Use React Native Alert
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
					return;
				} else {
					errorMessage +=
						'This might be due to:\n\n• Network connectivity issues\n• Website requires authentication\n• Server temporarily unavailable\n\nTry opening the URL in your browser first, then copy the recipe content manually.';
				}

				// Use React Native Alert
				Alert.alert('Network Error', errorMessage, [{ text: 'OK' }]);
				setIsProcessing(false);
				return;
			}

			if (!RecipeExtractor.isRecipePage(urlToUse, html)) {
				// Use React Native Alert
				Alert.alert(
					'No Recipe Found',
					'This webpage does not appear to contain a recipe. Please try a different URL from a recipe website like AllRecipes, Food Network, or Epicurious.',
					[{ text: 'OK' }]
				);
				setIsProcessing(false);
				return;
			}

			// Check if recipe already exists in database
			const existingRecipe = await RecipeDatabase.getRecipeByUrl(urlToUse);
			if (existingRecipe) {
				// Use React Native Alert
				Alert.alert(
					'Recipe Already Saved',
					`The recipe "${existingRecipe.title}" is already in your collection.`,
					[
						{ text: 'OK' },
						{
							text: 'View Recipe',
							onPress: () => {
								if (onRecipeSelect && existingRecipe) {
									onClose();
									onRecipeSelect(existingRecipe);
								} else {
									// Production build: console.log removed
								}
							},
						},
					]
				);

				setIsProcessing(false);
				onClose();
				return;
			}

			// Extract recipe from the webpage
			// Production build: console.log removed
			const extractionResult = await RecipeExtractor.extractRecipeFromUrl(urlToUse);

			// Handle new extraction result format: { recipe, error }

			if (!extractionResult || extractionResult.error || !extractionResult.recipe) {
				setIsProcessing(false);
				// Always show an alert and offer manual entry
				Alert.alert(
					'Extraction Failed',
					extractionResult?.error || "Could not extract recipe information from this webpage. The recipe might be in a format we don't support yet, or the page structure is too complex.",
					[
						{
							text: 'Enter Manually',
							onPress: () => setShowManualEntry(true),
						},
						{ text: 'OK' },
					]
				);
				// Always open manual entry modal as fallback
				setShowManualEntry(true);
				return;
			}

			const extractedRecipe = extractionResult.recipe;

			// Block saving if required fields are missing
			if (!extractedRecipe.title || !extractedRecipe.ingredients?.length || !extractedRecipe.directions?.length) {
				setIsProcessing(false);
				Alert.alert(
					'Incomplete Recipe',
					'The extracted recipe is missing a title, ingredients, or directions. Please enter the recipe manually.',
					[
						{
							text: 'Enter Manually',
							onPress: () => setShowManualEntry(true),
						},
						{ text: 'OK' },
					]
				);
				setShowManualEntry(true);
				return;
			}

			// Save recipe to database
			const saveResult = await RecipeDatabase.saveRecipe(extractedRecipe);

			if (saveResult.success) {
				const storageType = isSupabaseConfigured
					? 'Supabase database'
					: 'demo storage (temporary)';
				const setupNote = isSupabaseConfigured
					? ''
					: '\n\n💡 Set up Supabase for permanent storage (see SUPABASE_SETUP.md)';

				// Use React Native Alert
				Alert.alert(
					'Recipe Saved!',
					`Successfully saved "${extractedRecipe.title}" to ${storageType} with ${extractedRecipe.ingredients.length} ingredients and ${extractedRecipe.directions.length} steps.${setupNote}`,
					[
						{ text: 'OK' },
						{
							text: 'View Recipe',
							onPress: () => {
								if (onRecipeSelect && saveResult.data) {
									onClose();
									onRecipeSelect(saveResult.data);
								}
							},
						},
					]
				);
				onClose();
			} else {
				// Use React Native Alert
				Alert.alert(
					'Save Failed',
					`Could not save the recipe to your collection: ${saveResult.error}`,
					[{ text: 'OK' }]
				);
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

			// Use React Native Alert
			Alert.alert(errorTitle, errorMessage, [
				{ text: 'OK' },
				{
					text: 'Enter Manually',
					onPress: () => {
						// TODO: Open manual entry form
						// Production build: console.log removed
					},
				},
			]);
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
					{isUrlInputMode ? (
						// URL Input Mode
						<>
							<Text style={styles.modalTitle}>Add Recipe from URL</Text>
							<Text style={styles.modalText}>Enter the website URL for the recipe:</Text>
							
							<TextInput
								style={styles.urlInput}
								placeholder="https://example.com/recipe"
								placeholderTextColor="#666"
								value={inputUrl}
								onChangeText={setInputUrl}
								autoCapitalize="none"
								keyboardType="url"
								autoCorrect={false}
								multiline={false}
							/>
							
							<View style={styles.modalButtons}>
								<Button 
									label="Continue" 
									theme="primary" 
									onPress={handleUrlSubmit} 
									disabled={!inputUrl.trim()}
								/>
								<Button label="Cancel" onPress={onClose} />
							</View>
						</>
					) : (
						// URL Action Mode
						<>
							<Text style={styles.modalTitle}>Recipe Website Ready</Text>
							<Text style={styles.modalText}>Website: {inputUrl || url}</Text>

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
								<Button label='Edit URL' onPress={() => setIsUrlInputMode(true)} />
								<Button label='Cancel' onPress={onClose} />
							</View>
						</>
					)}
				</View>
			</View>

			<ManualRecipeModal
				visible={showManualEntry}
				onClose={() => setShowManualEntry(false)}
				initialUrl={isUrlInputMode ? inputUrl : (inputUrl || url)}
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
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#faf4eb',
		borderRadius: 10,
		padding: 20,
		width: '95%',
		maxWidth: 400,
		maxHeight: '80%',
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
	urlInput: {
		borderWidth: 1,
		borderColor: '#00205B',
		borderRadius: 8,
		padding: 12,
		marginBottom: 20,
		fontSize: 16,
		backgroundColor: '#fff',
		color: '#00205B',
		width: '100%',
		minHeight: 44,
	},
	modalButtons: {
		width: '100%',
		gap: 15,
		alignItems: 'center',
	},
	actionButtonsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 20,
		paddingHorizontal: 10,
		gap: 25,
		width: '100%',
		flexWrap: 'wrap',
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

