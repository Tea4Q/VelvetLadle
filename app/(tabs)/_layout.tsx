import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColors } from '../../contexts/ThemeContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { View } from 'react-native';

interface TabIconProps {
	focused: boolean;
	color: string;
	iconName: string;
	iconLibrary: 'FontAwesome6' | 'Ionicons';
	size?: number;
}

function TabIcon({ focused, color, iconName, iconLibrary, size = 24 }: TabIconProps) {
	const iconSize = focused ? size + 4 : size;
	const IconComponent = iconLibrary === 'FontAwesome6' ? FontAwesome6 : Ionicons;
	
	return (
		<View style={{ 
			alignItems: 'center',
			justifyContent: 'center',
			position: 'relative',
		}}>
			<IconComponent
				name={iconName as any}
				size={iconSize}
				color={color}
				style={{ 
					opacity: focused ? 1 : 0.7,
					textShadowColor: focused ? color : 'transparent',
					textShadowOffset: { width: 0, height: 0 },
					textShadowRadius: focused ? 2 : 0,
				}}
			/>
			{focused && (
				<View style={{
					position: 'absolute',
					bottom: -8,
					width: iconSize + 8,
					height: 2,
					backgroundColor: color,
					borderRadius: 1,
				}} />
			)}
		</View>
	);
}

export default function TabsLayout() {
	const colors = useColors();
	
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.secondary,
				tabBarInactiveTintColor: colors.textLight,
				headerStyle: { backgroundColor: colors.primary },
				headerTintColor: colors.textInverse,
				headerShadowVisible: false,
				tabBarStyle: { 
					backgroundColor: colors.primary,
					borderTopColor: colors.primaryLight,
					paddingBottom: 5,
					height: 65,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
					marginTop: 2,
				},
				tabBarItemStyle: {
					paddingVertical: 5,
				},
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					headerTitle: 'Velvet Ladle',
					tabBarIcon: ({ focused, color }) => (
						<TabIcon
							focused={focused}
							color={color}
							iconName="kitchen-set"
							iconLibrary="FontAwesome6"
						/>
					),
					tabBarLabel: 'Dashboard',
				}}
			/>
			<Tabs.Screen
				name='about'
				options={{
					headerTitle: 'About Velvet Ladle',
					tabBarIcon: ({ focused, color }) => (
						<TabIcon
							focused={focused}
							color={color}
							iconName="circle-info"
							iconLibrary="FontAwesome6"
						/>
					),
					tabBarLabel: 'About',
				}}
			/>
			<Tabs.Screen
				name='recipes'
				options={{
					headerTitle: 'My Recipes',
					tabBarIcon: ({ focused, color }) => (
						<TabIcon
							focused={focused}
							color={color}
							iconName="utensils"
							iconLibrary="FontAwesome6"
						/>
					),
					tabBarLabel: 'Recipes',
				}}
			/>
			<Tabs.Screen
				name='favorites'
				options={{
					headerTitle: 'My Favorites',
					tabBarIcon: ({ focused, color }) => (
						<TabIcon
							focused={focused}
							color={color}
							iconName={focused ? 'star' : 'star-outline'}
							iconLibrary="Ionicons"
						/>
					),
					tabBarLabel: 'Favorites',
				}}
			/>

		</Tabs>
	);
}
