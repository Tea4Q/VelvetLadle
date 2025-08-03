import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import AnimatedSplashScreen from './SplashScreenFullBackground';

export default function RootLayout() {
	const [isShowingSplash, setIsShowingSplash] = useState(true);

	const handleSplashFinish = () => {
		setIsShowingSplash(false);
	};

	if (isShowingSplash) {
		return (
			<ThemeProvider>
				<StatusBar style='light' />
				<AnimatedSplashScreen onAnimationFinish={handleSplashFinish} />
			</ThemeProvider>
		);
	}

	return (
		<ThemeProvider>
			<AuthProvider>
				<StatusBar style='light' />
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen
						name='(auth)'
						options={{
							headerShown: false,
						}}
					/>
					<Stack.Screen
						name='(tabs)'
						options={{
							headerShown: false,
						}}
					/>
					<Stack.Screen
						name='+not-found'
						options={{
							title: 'Not Found',
							headerShown: true,
							headerLeft: () => null,
						}}
					/>
				</Stack>
			</AuthProvider>
		</ThemeProvider>
	);
}
