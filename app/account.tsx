import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/buttons';
import { useAuth } from '../contexts/AuthContext';
import { useColors, useRadius, useSpacing } from '../contexts/ThemeContext';

export default function AccountScreen() {
	const colors = useColors();
	const spacing = useSpacing();
	const radius = useRadius();
	const router = useRouter();
	const { mode: urlMode } = useLocalSearchParams();
	const { user, signInAsGuest, signOut, signUp, signIn } = useAuth();

	const [mode, setMode] = useState<'signin' | 'signup'>('signup');
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	// Set mode from URL parameter
	useEffect(() => {
		if (urlMode === 'signin' || urlMode === 'signup') {
			setMode(urlMode);
		}
	}, [urlMode]);

	// Show account creation form if user is guest OR not logged in at all
	const isGuest = !user || user?.id === 'guest_user';

	const handleSignIn = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert('Error', 'Please enter email and password');
			return;
		}

		setIsLoading(true);
		try {
			const result = await signIn(email, password);
			
			if (result.success) {
				Alert.alert(
					'Welcome Back! 👋',
					'Successfully signed in to your account.',
					[
						{
							text: 'OK',
							onPress: () => router.replace('/'),
						},
					]
				);
			} else {
				Alert.alert('Error', result.error || 'Failed to sign in. Please check your credentials.');
			}
		} catch (error) {
			console.error('Sign in error:', error);
			Alert.alert('Error', 'Failed to sign in. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateAccount = async () => {
		if (!name.trim() || !email.trim() || !password.trim()) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Error', 'Password must be at least 6 characters');
			return;
		}

		setIsLoading(true);
		try {
			const result = await signUp(name, email, password);
			
			if (result.success) {
				Alert.alert(
					'Account Created! 🎉',
					'Your account has been created successfully. You can now save up to 10 recipes!',
					[
						{
							text: 'OK',
							onPress: () => router.replace('/'),
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
			setIsLoading(false);
		}
	};

	const handleSignOut = async () => {
		console.log('Sign out button clicked');
		
		// For web, Alert.alert may not work properly, so just sign out directly
		if (Platform.OS === 'web') {
			try {
				console.log('Starting sign out (web)');
				await signOut();
				console.log('Sign out successful, navigating to welcome');
				router.replace('/(auth)/welcome');
			} catch (error) {
				console.error('Error during sign out:', error);
				router.replace('/(auth)/welcome');
			}
			return;
		}
		
		// For native platforms, show confirmation
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
							console.log('User confirmed sign out');
							await signOut();
							console.log('Sign out successful, navigating to welcome');
							router.replace('/(auth)/welcome');
						} catch (error) {
							console.error('Error during sign out:', error);
							router.replace('/(auth)/welcome');
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
						{isGuest ? (mode === 'signin' ? 'Sign In' : 'Create Your Account') : 'Account'}
					</Text>
					<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
						{isGuest
							? (mode === 'signin' ? 'Welcome back to Velvet Ladle' : 'Unlock cloud sync and more features')
							: `Welcome, ${user?.name || 'Chef'}!`}
					</Text>
				</View>

				{isGuest ? (
					<>
						{/* Auth Form */}
						<View style={styles.form}>
							{mode === 'signup' && (
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
							)}

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

						{/* Benefits - only show for signup */}
						{mode === 'signup' && (
						<View style={styles.benefitsRow}>
							<View style={[styles.benefitsContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
								<Text style={[styles.benefitsTitle, { color: colors.primary }]}>
									With a free account:
								</Text>
								<View style={styles.benefit}>
									<Ionicons name="restaurant" size={20} color={colors.primary} />
									<Text style={[styles.benefitText, { color: colors.textSecondary }]}>
										Save up to 10 recipes
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
								<View style={styles.benefit}>
									<Ionicons name="star" size={20} color={colors.primary} />
									<Text style={[styles.benefitText, { color: colors.textSecondary }]}>
										Favorite recipes and web pages
									</Text>
								</View>
							</View>

							<View style={[styles.benefitsContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
								<Text style={[styles.benefitsTitle, { color: colors.primary }]}>
									Upgrade to paid for:
								</Text>
								<View style={styles.benefit}>
									<Ionicons name="infinite" size={20} color={colors.primary} />
									<Text style={[styles.benefitText, { color: colors.textSecondary, fontWeight: '600' }]}>
										Save unlimited recipes
									</Text>
								</View>
								<View style={styles.benefit}>
									<Ionicons name="sparkles" size={20} color={colors.primary} />
									<Text style={[styles.benefitText, { color: colors.textSecondary, fontWeight: '600' }]}>
										Advanced features (coming soon)
									</Text>
								</View>
							</View>
						</View>
						)}

						{/* Mode Toggle */}
					<View style={styles.modeToggle}>
						<Text style={[styles.modeToggleText, { color: colors.textSecondary }]}>
							{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
						</Text>
						<Button
							label={mode === 'signin' ? 'Create Account' : 'Sign In'}
							theme="link"
							size="sm"
							onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
						/>
					</View>

						{/* Actions */}
						<View style={styles.actions}>
							<Button
								label={isLoading ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') : (mode === 'signin' ? 'Sign In' : 'Create Free Account')}
								theme="primary"
								onPress={mode === 'signin' ? handleSignIn : handleCreateAccount}
								disabled={isLoading}
							/>
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
	benefitsRow: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 24,
	},
	benefitsContainer: {
		padding: 16,
		flex: 1,
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
	modeToggle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
		gap: 4,
	},
	modeToggleText: {
		fontSize: 14,
	},
	modeToggleLink: {
		minWidth: 'auto',
	},
	actions: {
		gap: 12,
	},
});
