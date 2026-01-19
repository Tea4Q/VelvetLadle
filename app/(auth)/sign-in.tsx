import Button from '@/components/buttons';
import { useAuth } from '@/contexts/AuthContext';
import { useColors, useRadius, useSpacing } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';

export default function SignInScreen() {
	const colors = useColors();
	const spacing = useSpacing();
	const radius = useRadius();
	const { signIn } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSigningIn, setIsSigningIn] = useState(false);

	const handleSignIn = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert('Error', 'Please enter both email and password');
			return;
		}

		setIsSigningIn(true);
		try {
			const result = await signIn(email.trim(), password);

			if (result.success) {
				// Navigation is handled by AuthContext
				router.replace('/(tabs)');
			} else {
				Alert.alert('Sign In Failed', result.error || 'Invalid email or password. Please try again.');
			}
		} catch (error) {
			console.error('Sign in error:', error);
			Alert.alert('Error', 'An unexpected error occurred. Please try again.');
		} finally {
			setIsSigningIn(false);
		}
	};

	const handleGoToCreateAccount = () => {
		router.push('/account');
	};

	const handleGoBack = () => {
		router.back();
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
					<View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
						<Ionicons name="log-in" size={48} color={colors.secondary} />
					</View>
					<Text style={[styles.title, { color: colors.primary }]}>Welcome Back!</Text>
					<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
						Sign in to access your recipes
					</Text>
				</View>

				{/* Sign In Form */}
				<View style={styles.form}>
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
							autoComplete="email"
							editable={!isSigningIn}
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
							placeholder="Enter your password"
							placeholderTextColor={colors.textLight}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
							autoComplete="password"
							editable={!isSigningIn}
							onSubmitEditing={handleSignIn}
						/>
					</View>
				</View>

				{/* Actions */}
				<View style={styles.actions}>
					<Button
						label={isSigningIn ? 'Signing In...' : 'Sign In'}
						theme="primary"
						onPress={handleSignIn}
						disabled={isSigningIn}
					/>
					<Button label="Back" theme="secondary" onPress={handleGoBack} disabled={isSigningIn} />
				</View>

				{/* Create Account Link */}
				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: colors.textLight }]}>
						Don't have an account?{' '}
					</Text>
					<Pressable onPress={handleGoToCreateAccount} disabled={isSigningIn}>
						<Text style={[styles.footerLink, { color: colors.primary }]}>Create Account</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingVertical: 40,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	iconContainer: {
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
	actions: {
		gap: 12,
		marginBottom: 24,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	footerText: {
		fontSize: 14,
	},
	footerLink: {
		fontSize: 14,
		fontWeight: '600',
		textDecorationLine: 'underline',
	},
});
