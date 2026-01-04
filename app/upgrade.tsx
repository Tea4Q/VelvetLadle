import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/buttons';
import { useColors, useSpacing } from '../contexts/ThemeContext';

export default function UpgradeScreen() {
	const colors = useColors();
	const spacing = useSpacing();
	const router = useRouter();

	const handleCreateAccount = () => {
		Alert.alert(
			'Coming Soon',
			'Account creation will be available in the next update! You\'ll be able to create an account to unlock unlimited recipes and cloud sync.',
			[{ text: 'OK' }]
		);
	};

	const handleGoBack = () => {
		router.push('/(tabs)/recipes');
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.content, { padding: spacing.lg }]}>
				{/* Icon */}
				<View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
					<Ionicons name="rocket" size={64} color={colors.secondary} />
				</View>

				{/* Title */}
				<Text style={[styles.title, { color: colors.primary }]}>
					Recipe Limit Reached
				</Text>

				{/* Subtitle */}
				<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
					Guest users can save up to 10 recipes
				</Text>

				{/* Features List */}
				<View style={styles.featuresContainer}>
					<Text style={[styles.featuresTitle, { color: colors.primary }]}>
						Create a free account to unlock:
					</Text>

					<View style={styles.feature}>
						<Ionicons name="infinite" size={24} color={colors.primary} />
						<Text style={[styles.featureText, { color: colors.textSecondary }]}>
							Unlimited recipes
						</Text>
					</View>

					<View style={styles.feature}>
						<Ionicons name="cloud-upload" size={24} color={colors.primary} />
						<Text style={[styles.featureText, { color: colors.textSecondary }]}>
							Cloud sync across devices
						</Text>
					</View>

					<View style={styles.feature}>
						<Ionicons name="shield-checkmark" size={24} color={colors.primary} />
						<Text style={[styles.featureText, { color: colors.textSecondary }]}>
							Secure backup of all your recipes
						</Text>
					</View>

					<View style={styles.feature}>
						<Ionicons name="people" size={24} color={colors.primary} />
						<Text style={[styles.featureText, { color: colors.textSecondary }]}>
							Share recipes with friends (coming soon)
						</Text>
					</View>

					<View style={styles.feature}>
						<Ionicons name="star" size={24} color={colors.primary} />
						<Text style={[styles.featureText, { color: colors.textSecondary }]}>
							Premium features & recipe collections
						</Text>
					</View>
				</View>

				{/* Call to Action */}
				<View style={styles.ctaContainer}>
					<Button
						label="Create Free Account"
						theme="primary"
						onPress={handleCreateAccount}
					/>
					<Button
						label="Go Back"
						onPress={handleGoBack}
					/>
				</View>

				{/* Info Text */}
				<Text style={[styles.infoText, { color: colors.textLight }]}>
					Don't worry, your existing recipes are safe and will be kept when you create an account.
				</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 32,
		opacity: 0.8,
	},
	featuresContainer: {
		width: '100%',
		marginBottom: 32,
		padding: 20,
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
	},
	featuresTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 16,
	},
	feature: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		gap: 12,
	},
	featureText: {
		flex: 1,
		fontSize: 16,
	},
	ctaContainer: {
		width: '100%',
		gap: 12,
		marginBottom: 24,
	},
	infoText: {
		fontSize: 14,
		textAlign: 'center',
		fontStyle: 'italic',
		paddingHorizontal: 20,
	},
});
