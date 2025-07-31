import { Stack } from 'expo-router';
import { useColors } from '../../contexts/ThemeContext';

export default function AuthLayout() {
	const colors = useColors();
	
	return (
		<Stack
			screenOptions={{
				headerShown: false, // Hide headers for auth screens
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen
				name="welcome"
				options={{
					title: 'Welcome',
				}}
			/>
		</Stack>
	);
}
