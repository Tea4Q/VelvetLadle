import ManualRecipeModal from '@/components/ManualRecipeModal';
import UrlActionModal from '@/components/UrlActionModal';
import { useColors, useRadius } from '@/contexts/ThemeContext';
import { Recipe } from '@/lib/supabase';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

export default function AddScreen() {
	const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
	const [showManualModal, setShowManualModal] = useState<boolean>(false);
	const [processedUrl, setProcessedUrl] = useState<string>('');
	const [testRecipeSource, setTestRecipeSource] = useState<string>('');

	const colors = useColors();
	const radius = useRadius();

	const handleTestRecipeSourceChange = (text: string) => {
		console.log('Test recipe source changed to:', `"${text}"`);
		setTestRecipeSource(text);
	};

	const handleWebPageOption = () => {
		console.log('handleWebPageOption called - opening URL modal directly');
		// Open the URL modal with an empty URL - the modal should handle URL input
		setProcessedUrl('');
		setShowUrlModal(true);
	};

	const handleOCROption = () => {
		Alert.alert(
			'OCR Feature',
			'OCR scanning will be implemented soon. This will allow you to scan images and extract text from recipes.',
			[{ text: 'OK' }]
		);
	};

	const handleManualOption = () => {
		setShowManualModal(true);
	};

	const closeModal = () => {
		console.log('Modal closed');
		setShowUrlModal(false);
	};

	const closeManualModal = () => {
		setShowManualModal(false);
	};

	const handleManualRecipeUpdated = () => {
		console.log('Manual recipe was updated/saved');
		// The modal will close itself, we just need to handle any additional logic
	};

	const handleRecipeSelect = (recipe: Recipe) => {
		// Navigate to recipes tab where the user can view the recipe
		router.push('/(tabs)/recipes');
	};

	const QuickActionCard = ({
		icon,
		title,
		subtitle,
		onPress,
		theme = 'primary',
	}: {
		icon: string;
		title: string;
		subtitle: string;
		onPress: () => void;
		theme?: 'primary' | 'secondary';
	}) => (
		<Pressable
			onPress={onPress}
			android_ripple={{ color: colors.textInverse, radius: 150 }}
			hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			style={({ pressed }) => [
				styles.quickActionCard,
				{
					backgroundColor: theme === 'primary' ? colors.primary : colors.accent,
					borderRadius: radius.md,
					opacity: pressed ? 0.8 : 1,
					transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
				},
			]}
		>
			<FontAwesome6
				name={icon as any}
				size={48}
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

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.mainContainer}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View style={styles.headerSection}>
					<View style={styles.titleContainer}>
						<Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
							What&apos;s cooking today?
						</Text>
						<Text style={[styles.screenSubtitle, { color: colors.textLight }]}>
							Choose how you&apos;d like to add a new recipe
						</Text>
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.quickActionsSection}>
					<View style={styles.quickActionsGrid}>
						<QuickActionCard
							icon='egg'
							title='Add Recipe'
							subtitle='From website URL'
							onPress={handleWebPageOption}
							theme='primary'
						/>
						<QuickActionCard
							icon='carrot'
							title='Scan Recipe'
							subtitle='OCR from image'
							onPress={handleOCROption}
							theme='secondary'
						/>
						<QuickActionCard
							icon='pen-to-square'
							title='Manual Entry'
							subtitle='Type recipe details'
							onPress={handleManualOption}
							theme='primary'
						/>
					</View>
				</View>

				{/* Tips Section */}
				<View style={styles.tipsSection}>
					<Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
						💡 Tips
					</Text>
					<View
						style={[
							styles.tipCard,
							{ backgroundColor: colors.surface, borderRadius: radius.md },
						]}
					>
						<FontAwesome6 name='lightbulb' size={16} color={colors.accent} />
						<Text style={[styles.tipText, { color: colors.textLight }]}>
							Try popular recipe sites like AllRecipes, Food Network, or your favorite food blog!
						</Text>
					</View>
				</View>
			</ScrollView>

			<UrlActionModal
				visible={showUrlModal}
				url={processedUrl}
				onClose={closeModal}
				onRecipeSelect={handleRecipeSelect}
			/>
			
			<ManualRecipeModal
				visible={showManualModal}
				onClose={closeManualModal}
				onRecipeSelect={handleRecipeSelect}
				onRecipeUpdated={handleManualRecipeUpdated}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mainContainer: {
		flexGrow: 1,
		padding: 20,
	},
	headerSection: {
		alignItems: 'center',
		marginBottom: 32,
	},
	titleContainer: {
		alignItems: 'center',
	},
	screenTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	screenSubtitle: {
		fontSize: 16,
		opacity: 0.8,
		textAlign: 'center',
	},
	quickActionsSection: {
		marginBottom: 32,
	},
	quickActionsGrid: {
		gap: 20,
	},
	quickActionCard: {
		padding: 32,
		alignItems: 'center',
		gap: 16,
		minHeight: 180,
		justifyContent: 'center',
	},
	quickActionIcon: {
		marginBottom: 8,
	},
	quickActionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	quickActionSubtitle: {
		fontSize: 14,
		textAlign: 'center',
		opacity: 0.9,
	},
	tipsSection: {
		marginBottom: 120,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	tipCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},
	tipText: {
		fontSize: 14,
		flex: 1,
		lineHeight: 20,
	},
});
