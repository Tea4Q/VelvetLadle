import Button from '@/components/button';
import ImageViewer from '@/components/imageViewer';
import UrlActionModal from '@/components/UrlActionModal';
import { useState, useEffect } from 'react';
import { Alert, StyleSheet, TextInput, View, Text, ScrollView, Pressable } from 'react-native';
import { RecipeDatabase } from '@/services/recipeDatabase';
import { useColors, useRadius } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const placeHolderImage = require('../../assets/images/splashIllustration.png');

export default function Index() {
	const [selectedOption, setSelectedOption] = useState<
		'web' | 'ocr' | undefined
	>(undefined);
	const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
	const [webUrl, setWebUrl] = useState<string>('');
	const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
	const [processedUrl, setProcessedUrl] = useState<string>('');
	const [recipeCount, setRecipeCount] = useState<number>(0);

	const colors = useColors();
	const radius = useRadius();
	
	// Use auth context instead of local state
	const { isAuthenticated, user, signInAsGuest } = useAuth();

	// Load recipe count on component mount and when URL modal closes
	const loadRecipeCount = async () => {
		try {
			const recipes = await RecipeDatabase.getAllRecipes();
			setRecipeCount(recipes.length);
		} catch (error) {
			console.error('Error loading recipe count:', error);
		}
	};

	useEffect(() => {
		loadRecipeCount();
	}, []);

	const handleWebPageOption = () => {
		setSelectedOption('web');
		setShowAppOptions(true);
	};

	const handleOCROption = () => {
		setSelectedOption('ocr');
		Alert.alert(
			'OCR Feature',
			'OCR scanning will be implemented soon. This will allow you to scan images and extract text from recipes.',
			[{ text: 'OK' }]
		);
		setShowAppOptions(true);
	};

	const handleWebUrlSubmit = () => {
		if (!webUrl.trim()) {
			console.log('Empty URL - showing error alert');
			Alert.alert('Error', 'Please enter a valid URL');
			return;
		}
		
		// Basic URL validation
		let url = webUrl.trim();
		
		// Add protocol if missing
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'https://' + url;
		}

		// Use external modal
		setProcessedUrl(url);
		setShowUrlModal(true);
	};

	const closeModal = () => {
		console.log('Modal closed');
		setShowUrlModal(false);
		// Refresh recipe count when modal closes (in case a recipe was added)
		loadRecipeCount();
	};

	const QuickActionCard = ({ icon, title, subtitle, onPress, theme = 'primary' }: {
		icon: string;
		title: string;
		subtitle: string;
		onPress: () => void;
		theme?: 'primary' | 'secondary';
	}) => (
		<Pressable 
			style={[styles.quickActionCard, { 
				backgroundColor: theme === 'primary' ? colors.primary : colors.accent,
				borderRadius: radius.md,
			}]}
			onPress={onPress}
		>
			<FontAwesome6 
				name={icon as any} 
				size={32} 
				color={colors.textInverse}
				style={styles.quickActionIcon}
			/>
			<Text style={[styles.quickActionTitle, { color: colors.textInverse }]}>
				{title}
			</Text>
			<Text style={[styles.quickActionSubtitle, { color: colors.textInverse }]}>
				{subtitle}
			</Text>
		</Pressable>
	);

	if (!isAuthenticated) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<ScrollView contentContainerStyle={styles.authContainer}>
					{/* Logo/Brand Section */}
					<View style={styles.brandSection}>
						<ImageViewer imgSource={placeHolderImage} />
						<Text style={[styles.brandTitle, { color: colors.primary }]}>
							Welcome to Velvet Ladle
						</Text>
						<Text style={[styles.brandSubtitle, { color: colors.textLight }]}>
							Your personal recipe collection & discovery platform
						</Text>
					</View>

					{/* Auth Buttons */}
					<View style={styles.authButtonsContainer}>
						<Button
							label="Sign In"
							theme="primary"
							onPress={() => signInAsGuest()}
						/>
						<Button
							label="Create Account"
							theme="secondary"
							onPress={() => signInAsGuest()}
						/>
						<Pressable style={styles.guestButton} onPress={() => signInAsGuest()}>
							<Text style={[styles.guestButtonText, { color: colors.textLight }]}>
								Continue as Guest
							</Text>
						</Pressable>
					</View>

					{/* Features Preview */}
					<View style={styles.featuresPreview}>
						<Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>
							✨ What you can do:
						</Text>
						<View style={styles.featuresList}>
							<Text style={[styles.featureItem, { color: colors.textLight }]}>
								🌐 Save recipes from any website
							</Text>
							<Text style={[styles.featureItem, { color: colors.textLight }]}>
								⭐ Create your personal favorites collection
							</Text>
							<Text style={[styles.featureItem, { color: colors.textLight }]}>
								🔍 Search by ingredients or cuisine
							</Text>
							<Text style={[styles.featureItem, { color: colors.textLight }]}>
								📱 Scan recipes with OCR (coming soon)
							</Text>
						</View>
					</View>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView contentContainerStyle={styles.mainContainer} showsVerticalScrollIndicator={false}>
				{/* Header Section */}
				<View style={styles.headerSection}>
					<View style={styles.welcomeContainer}>
						<Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
							Welcome back, {user?.name || 'Chef'}! 👋
						</Text>
						<Text style={[styles.welcomeSubtext, { color: colors.textLight }]}>
							What&apos;s cooking today?
						</Text>
					</View>
					<Pressable style={[styles.profileButton, { backgroundColor: colors.primaryLight }]}>
						<FontAwesome6 name="user" size={20} color={colors.primary} />
					</Pressable>
				</View>

				{/* Stats Cards */}
				<View style={styles.statsContainer}>
					<View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
						<FontAwesome6 name="book" size={24} color={colors.primary} />
						<Text style={[styles.statNumber, { color: colors.primary }]}>{recipeCount}</Text>
						<Text style={[styles.statLabel, { color: colors.textLight }]}>
							Recipe{recipeCount !== 1 ? 's' : ''}
						</Text>
					</View>
					<View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
						<FontAwesome6 name="star" size={24} color={colors.accent} />
						<Text style={[styles.statNumber, { color: colors.accent }]}>12</Text>
						<Text style={[styles.statLabel, { color: colors.textLight }]}>Favorites</Text>
					</View>
					<View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
						<FontAwesome6 name="clock" size={24} color={colors.accentLight} />
						<Text style={[styles.statNumber, { color: colors.accentLight }]}>3</Text>
						<Text style={[styles.statLabel, { color: colors.textLight }]}>Recent</Text>
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.quickActionsSection}>
					<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
						Quick Actions
					</Text>
					<View style={styles.quickActionsGrid}>
						<QuickActionCard
							icon="globe"
							title="Add Recipe"
							subtitle="From website URL"
							onPress={handleWebPageOption}
							theme="primary"
						/>
						<QuickActionCard
							icon="camera"
							title="Scan Recipe"
							subtitle="OCR from image"
							onPress={handleOCROption}
							theme="secondary"
						/>
					</View>
				</View>

				{/* URL Input Section (when web option selected) */}
				{showAppOptions && selectedOption === 'web' && (
					<View style={[styles.urlInputSection, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
						<Text style={[styles.inputSectionTitle, { color: colors.textPrimary }]}>
							🌐 Enter Recipe Website URL
						</Text>
						<View style={styles.urlInputContainer}>
							<TextInput
								style={[styles.modernTextInput, { 
									backgroundColor: colors.background,
									borderColor: colors.border,
									color: colors.textPrimary
								}]}
								placeholder='https://example.com/recipe'
								placeholderTextColor={colors.textLight}
								value={webUrl}
								onChangeText={setWebUrl}
								autoCapitalize='none'
								keyboardType='url'
							/>
							<View style={styles.urlInputButtons}>
								<Button
									label='Add Recipe'
									theme='primary'
									onPress={handleWebUrlSubmit}
								/>
								<Button 
									label='Cancel' 
									onPress={() => setShowAppOptions(false)} 
								/>
							</View>
						</View>
					</View>
				)}

				{/* Recent Activity */}
				<View style={styles.recentSection}>
					<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
						Recent Activity
					</Text>
					<View style={[styles.recentCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
						<FontAwesome6 name="clock" size={16} color={colors.textLight} />
						<Text style={[styles.recentText, { color: colors.textLight }]}>
							{recipeCount > 0 
								? `Last recipe added 2 hours ago` 
								: 'No recipes yet - add your first one!'
							}
						</Text>
					</View>
				</View>
			</ScrollView>
			
			<UrlActionModal
				visible={showUrlModal}
				url={processedUrl}
				onClose={closeModal}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	// Legacy styles for compatibility
	text: {
		color: '#00205B',
		fontFamily: 'Nunito',
		fontSize: 20,
		fontWeight: 'bold',
	},
	container: {
		flex: 1,
		backgroundColor: '#faf4eb',
	},
	button: {
		backgroundColor: '#00205B',
		padding: 5,
		borderRadius: 5,
		marginTop: 20,
		textAlign: 'center',
		textDecorationLine: 'underline',
		width: '10%',
		fontWeight: 'bold',
	},
	imageContainer: {
		flex: 1,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#00205B',
		borderRadius: 8,
		padding: 12,
		marginBottom: 15,
		width: '100%',
		fontSize: 16,
		backgroundColor: '#fff',
	},

	// New modern styles
	authContainer: {
		flexGrow: 1,
		padding: 24,
		justifyContent: 'center',
	},
	brandSection: {
		alignItems: 'center',
		marginBottom: 48,
	},
	brandTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		marginTop: 16,
		marginBottom: 8,
	},
	brandSubtitle: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 24,
	},
	authButtonsContainer: {
		gap: 16,
		marginBottom: 32,
	},
	guestButton: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	guestButtonText: {
		fontSize: 16,
		textDecorationLine: 'underline',
	},
	featuresPreview: {
		alignItems: 'center',
	},
	featuresTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	featuresList: {
		gap: 8,
	},
	featureItem: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},

	// Main app styles
	mainContainer: {
		flexGrow: 1,
		padding: 20,
	},
	headerSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	welcomeContainer: {
		flex: 1,
	},
	welcomeText: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	welcomeSubtext: {
		fontSize: 16,
		opacity: 0.8,
	},
	profileButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 32,
		gap: 12,
	},
	statCard: {
		flex: 1,
		padding: 20,
		alignItems: 'center',
		gap: 8,
	},
	statNumber: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	statLabel: {
		fontSize: 12,
		textAlign: 'center',
	},
	quickActionsSection: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	quickActionsGrid: {
		flexDirection: 'row',
		gap: 16,
	},
	quickActionCard: {
		flex: 1,
		padding: 24,
		alignItems: 'center',
		gap: 12,
	},
	quickActionIcon: {
		marginBottom: 4,
	},
	quickActionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	quickActionSubtitle: {
		fontSize: 12,
		textAlign: 'center',
		opacity: 0.9,
	},
	urlInputSection: {
		padding: 24,
		marginBottom: 32,
	},
	inputSectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
		textAlign: 'center',
	},
	urlInputContainer: {
		gap: 16,
	},
	modernTextInput: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
	},
	urlInputButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	recentSection: {
		marginBottom: 24,
	},
	recentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},
	recentText: {
		fontSize: 14,
		flex: 1,
	},
});
