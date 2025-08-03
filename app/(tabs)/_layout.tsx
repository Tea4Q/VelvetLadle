import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../contexts/ThemeContext';




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
	const insets = useSafeAreaInsets();
	
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
					paddingBottom: Math.max(insets.bottom, 8),
					paddingTop: 8,
					height: 80 + Math.max(insets.bottom - 8, 0),
					position: 'absolute',
					bottom: 0,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: '600',
					marginTop: 4,
					marginBottom: 2,
				},
				tabBarItemStyle: {
					paddingVertical: 4,
					paddingHorizontal: 2,
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
							iconName='kitchen-set'
							iconLibrary='FontAwesome6'
						/>
					),
					tabBarLabel: 'Dashboard',
				}}
			/>
			<Tabs.Screen
				name='add'
				options={{
					headerTitle: 'Add Recipe',
					tabBarIcon: ({ focused, color }) => (
						<TabIcon
							focused={focused}
							color={color}
							iconName='plus'
							iconLibrary='FontAwesome6'
						/>
					),
					tabBarLabel: 'Add',
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
							iconName='utensils'
							iconLibrary='FontAwesome6'
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
							iconLibrary='Ionicons'
						/>
					),
					tabBarLabel: 'Favorites',
				}}
			/>
		</Tabs>
	);
}
