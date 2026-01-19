import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/buttons';
import { useAuth } from '../contexts/AuthContext';
import { useColors, useRadius, useSpacing } from '../contexts/ThemeContext';
import { RecipeDatabase } from '../services/recipeDatabase';
import AuthService from '../services/AuthService';

export default function AccountScreen() {
	const colors = useColors();
	const spacing = useSpacing();
	const radius = useRadius();
	const router = useRouter();
	const { user, signInAsGuest, signOut } = useAuth();

	const [isCreatingAccount, setIsCreatingAccount] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const isGuest = user?.id === 'guest_user';

	const handleCreateAccount = async () => {
		if (!name.trim() || !email.trim() || !password.trim()) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Error', 'Password must be at least 6 characters');
			return;
		}

		setIsCreatingAccount(true);
		try {
			const result = await AuthService.signUp(name, email, password);
			
				if (result.success && result.user) {
					Alert.alert(
						'Account Created! 🎉',
						'Your account has been created successfully. You can now save unlimited recipes!',
						[
							{
								text: 'OK',
								onPress: () => {
									// Refresh auth context by navigating away and back
									router.replace('/');
								},
							},
						]
					);
				} else {
				Alert.alert('Error', result.error || 'Failed to create account. Please try again.');
			}
		} catch (error) {
			console.error('Account creation error:', error);
			Alert.alert('Error', 'Failed to create account. Please try again.');
		} finally {
			setIsCreatingAccount(false);
		}
	};

	const handleSignOut = async () => {
		Alert.alert(
			'Sign Out',
			'Are you sure you want to sign out? Your recipes will be saved.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Sign Out',
					style: 'destructive',
					onPress: async () => {
						try {
							// Check if user has any recipes
							const recipes = await RecipeDatabase.getAllRecipes();
							const hasRecipes = recipes.length > 0;
							
							// Sign out using context method (updates auth state properly)
							await signOut();
							
							// Navigate based on whether recipes exist
							if (hasRecipes) {
								router.replace('/recipes');
							} else {
								router.replace('/');
							}
						} catch (error) {
							console.error('Error during sign out:', error);
							// Fallback to home on error
							router.replace('/');
						}
					},
				},
			]
		);
	};

	const handleGoBack = () => {
		router.replace('/');
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				contentContainerStyle={[styles.content, { padding: spacing.lg }]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Header */}
				<View style={styles.header}>
					<View style={[styles.profileIcon, { backgroundColor: colors.primary }]}>
						<Ionicons name="person" size={48} color={colors.secondary} />
					</View>
					<Text style={[styles.title, { color: colors.primary }]}>
						{isGuest ? 'Create Your Account' : 'Account'}
					</Text>
					<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
						{isGuest
							? 'Unlock unlimited recipes and cloud sync'
							: `Welcome, ${user?.name || 'Chef'}!`}
					</Text>
				</View>

				{isGuest ? (
					<>
						{/* Account Creation Form */}
						<View style={styles.form}>
							<View style={styles.inputGroup}>
								<Text style={[styles.label, { color: colors.textPrimary }]}>Name</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: colors.surface,
											borderColor: colors.border,
											color: colors.textPrimary,
											borderRadius: radius.md,
										},
									]}
									placeholder="Your name"
									placeholderTextColor={colors.textLight}
									value={name}
									onChangeText={setName}
									autoCapitalize="words"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: colors.surface,
											borderColor: colors.border,
											color: colors.textPrimary,
											borderRadius: radius.md,
										},
									]}
									placeholder="your.email@example.com"
									placeholderTextColor={colors.textLight}
									value={email}
									onChangeText={setEmail}
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: colors.surface,
											borderColor: colors.border,
											color: colors.textPrimary,
											borderRadius: radius.md,
										},
									]}
									placeholder="At least 6 characters"
									placeholderTextColor={colors.textLight}
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>
						</View>

						{/* Benefits */}
						<View style={[styles.benefitsContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
							<Text style={[styles.benefitsTitle, { color: colors.primary }]}>
								With a free account:
							</Text>
							<View style={styles.benefit}>
								<Ionicons name="infinite" size={20} color={colors.primary} />
								<Text style={[styles.benefitText, { color: colors.textSecondary }]}>
									Save unlimited recipes
								</Text>
							</View>
							<View style={styles.benefit}>
								<Ionicons name="cloud-upload" size={20} color={colors.primary} />
								<Text style={[styles.benefitText, { color: colors.textSecondary }]}>
									Cloud sync across all devices
								</Text>
							</View>
							<View style={styles.benefit}>
								<Ionicons name="shield-checkmark" size={20} color={colors.primary} />
								<Text style={[styles.benefitText, { color: colors.textSecondary }]}>
									Secure backup of your collection
								</Text>
							</View>
						</View>

						{/* Actions */}
						<View style={styles.actions}>
							<Button
								label={isCreatingAccount ? 'Creating Account...' : 'Create Free Account'}
								theme="primary"
								onPress={handleCreateAccount}
								disabled={isCreatingAccount}
							/>
							<Button label="Continue as Guest" onPress={handleGoBack} />
						</View>
					</>
				) : (
					<>
						{/* Account Info */}
						<View style={[styles.infoContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
							<View style={styles.infoRow}>
								<Text style={[styles.infoLabel, { color: colors.textLight }]}>Email:</Text>
								<Text style={[styles.infoValue, { color: colors.textPrimary }]}>
									{user?.email || 'Not set'}
								</Text>
							</View>
							<View style={styles.infoRow}>
								<Text style={[styles.infoLabel, { color: colors.textLight }]}>Account Type:</Text>
								<Text style={[styles.infoValue, { color: colors.textPrimary }]}>Free</Text>
							</View>
							<View style={styles.infoRow}>
								<Text style={[styles.infoLabel, { color: colors.textLight }]}>Member Since:</Text>
								<Text style={[styles.infoValue, { color: colors.textPrimary }]}>
									{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
								</Text>
							</View>
						</View>

						{/* Actions */}
						<View style={styles.actions}>
							<Button label="Sign Out" theme="secondary" onPress={handleSignOut} />
							<Button label="Back to Dashboard" onPress={handleGoBack} />
						</View>
					</>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingVertical: 40,
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	profileIcon: {
		width: 96,
		height: 96,
		borderRadius: 48,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
	},
	form: {
		marginBottom: 24,
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
	},
	benefitsContainer: {
		padding: 16,
		marginBottom: 24,
	},
	benefitsTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	benefit: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 12,
	},
	benefitText: {
		fontSize: 14,
		flex: 1,
	},
	infoContainer: {
		padding: 16,
		marginBottom: 24,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	infoLabel: {
		fontSize: 14,
		fontWeight: '600',
	},
	infoValue: {
		fontSize: 14,
	},
	actions: {
		gap: 12,
	},
});
