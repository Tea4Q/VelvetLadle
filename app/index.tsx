import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthGate() {
	const { isAuthenticated, isLoading } = useAuth();
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		// Small delay to ensure auth state is properly loaded
		const timer = setTimeout(() => {
			setIsReady(true);
		}, 100);

		return () => clearTimeout(timer);
	}, []);

	// Show loading spinner while auth is being checked
	if (isLoading || !isReady) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	// Redirect based on auth status
	if (isAuthenticated) {
		return <Redirect href="/(tabs)" />;
	} else {
		return <Redirect href="/(auth)/welcome" />;
	}
}
