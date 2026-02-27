import { RecipeDatabase } from '@/services/recipeDatabase';
import { Ionicons } from '@expo/vector-icons';
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
import { Recipe } from '../lib/supabase';
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
	const [processingStatus, setProcessingStatus] = useState<string>('Starting extraction...');
	const [showManualEntry, setShowManualEntry] = useState(false);
	const [inputUrl, setInputUrl] = useState('');
	const [isUrlInputMode, setIsUrlInputMode] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [testRecipeSource, setTestRecipeSource] = useState<string>('');

	const getFriendlyExtractionError = (errorMessage?: string) => {
		const message = (errorMessage || '').toLowerCase();

		if (
			message.includes('network request failed') ||
			message.includes('failed to fetch') ||
			message.includes('networkerror when attempting to fetch resource') ||
			message.includes('typeerror: networkerror')
		) {
			return 'Could not access this website right now. Please check your connection, try again, or use manual entry.';
		}

		if (message.includes('timeout')) {
			return 'The website took too long to respond. Please try again or use manual entry.';
		}

		if (message.includes('cors') || message.includes('blocked') || message.includes('forbidden')) {
			return 'This website blocks automated access. Please use manual entry for this recipe.';
		}

		return errorMessage || "Could not extract recipe information from this webpage. The recipe might be in a format we don't support yet, or the page structure is too complex.";
	};

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
		setProcessingStatus('Validating URL...');

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
			setProcessingStatus('Connecting to website...');
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
			setProcessingStatus('Checking for duplicates...');
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
			setProcessingStatus('Extracting recipe data...');
			const extractionResult = await RecipeExtractor.extractRecipeFromUrl(urlToUse);

			// Handle new extraction result format: { recipe, error }

			if (!extractionResult || extractionResult.error || !extractionResult.recipe) {
				setIsProcessing(false);
				const userFacingError = getFriendlyExtractionError(extractionResult?.error);
				// Always show an alert and offer manual entry
				Alert.alert(
					'Extraction Failed',
					userFacingError,
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

			// Validate critical fields (title and ingredients are required)
			if (!extractedRecipe.title || !extractedRecipe.ingredients?.length) {
				setIsProcessing(false);
				Alert.alert(
					'Incomplete Recipe',
					'The extracted recipe is missing a title or ingredients. Please enter the recipe manually.',
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

			// Check what data is missing
			const missingFields: string[] = [];
			if (!extractedRecipe.directions || extractedRecipe.directions.length === 0) {
				missingFields.push('Directions');
			}
			if (!extractedRecipe.nutritional_info || 
				(!extractedRecipe.nutritional_info.calories && 
				 !extractedRecipe.nutritional_info.protein && 
				 !extractedRecipe.nutritional_info.carbs)) {
				missingFields.push('Nutritional Info');
			}
			if (!extractedRecipe.prep_time_minutes && !extractedRecipe.cook_time_minutes) {
				missingFields.push('Cooking Times');
			}
			if (!extractedRecipe.description) {
				missingFields.push('Description');
			}

			// Save recipe to database with available data
			setProcessingStatus('Saving recipe...');
			const saveResult = await RecipeDatabase.saveRecipe(extractedRecipe);

			if (saveResult.success) {
				// Show brief success status
				setProcessingStatus('Recipe saved! Opening...');
				
				// Auto-navigate to recipe view after a brief moment
				setTimeout(() => {
					if (onRecipeSelect && saveResult.data) {
						onClose();
						onRecipeSelect(saveResult.data);
					}
				}, 500);
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
							{isProcessing ? (
							// Processing overlay - Modern design
							<View style={styles.processingContainer}>
								{/* Top decorative element */}
								<View style={styles.processingDecoration}>
									<Ionicons name="restaurant" size={32} color="#00205B" />
								</View>
								
								{/* Main spinner */}
								<View style={styles.processingIconContainer}>
									<View style={styles.spinnerOuterRing} />
									<ActivityIndicator size='large' color='#00205B' />
								</View>
								
								{/* Title and status */}
								<View style={styles.processingTextContainer}>
									<Text style={styles.processingTitle}>Processing Recipe</Text>
									<View style={styles.statusBadge}>
										<Ionicons name="time-outline" size={16} color="#00205B" style={{ marginRight: 6 }} />
										<Text style={styles.processingStatus}>{processingStatus}</Text>
									</View>
								</View>
								
								{/* Progress bar */}
								<View style={styles.progressBarContainer}>
									<View style={styles.progressBar}>
										<View style={styles.progressBarFill} />
									</View>
								</View>
								
								{/* Bottom hint */}
								<View style={styles.processingFooter}>
									<Ionicons name="sparkles" size={14} color="#00205B" style={{ opacity: 0.5, marginRight: 6 }} />
									<Text style={styles.processingHint}>Extracting recipe details</Text>
								</View>
								</View>
							) : (
								// Action buttons
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
											<ProcessButton
												icon='cog'
												label='Process Recipe'
												onPress={processRecipe}
											/>
										</View>
										<Button label='Edit URL' onPress={() => setIsUrlInputMode(true)} />
										<Button label='Cancel' onPress={onClose} />
									</View>
								</>
							)}
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
	processingContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
		paddingHorizontal: 30,
		width: '100%',
	},
	processingDecoration: {
		marginBottom: 20,
		opacity: 0.3,
	},
	processingIconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		shadowColor: '#00205B',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		borderWidth: 3,
		borderColor: '#e8f0ff',
	},
	spinnerOuterRing: {
		position: 'absolute',
		width: 90,
		height: 90,
		borderRadius: 45,
		borderWidth: 2,
		borderColor: '#e8f0ff',
		borderStyle: 'dashed',
	},
	processingTextContainer: {
		alignItems: 'center',
		gap: 12,
		marginBottom: 20,
	},
	processingTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#00205B',
		letterSpacing: 0.5,
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		shadowColor: '#00205B',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#e8f0ff',
	},
	processingStatus: {
		fontSize: 14,
		color: '#00205B',
		fontWeight: '600',
		textAlign: 'center',
	},
	progressBarContainer: {
		width: '100%',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	progressBar: {
		height: 4,
		backgroundColor: '#e8f0ff',
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#00205B',
		borderRadius: 2,
		width: '60%',
		opacity: 0.8,
	},
	processingFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	processingHint: {
		fontSize: 13,
		color: '#00205B',
		opacity: 0.5,
		textAlign: 'center',
		fontStyle: 'italic',
	},
});

