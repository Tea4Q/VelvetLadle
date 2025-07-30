import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<StatusBar style='light' />
				<Stack>
					<Stack.Screen
						name='(tabs)'
						options={{
							headerShown: false, // Hide the header for the tabs layout
						}}
					/>
					<Stack.Screen
						name='not-found'
						options={{
							title: 'Not Found',
							headerLeft: () => null, // Hide the back button
						}}
					/>
				</Stack>
			</AuthProvider>
		</ThemeProvider>
	);
}
