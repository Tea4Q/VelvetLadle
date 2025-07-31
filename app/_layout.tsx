import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
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
