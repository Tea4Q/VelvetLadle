import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useColors, useSpacing, useRadius, useTypography, useElevation } from '../contexts/ThemeContext';

type Props = {
	label: string;
	theme?: 'primary' | 'secondary' | 'outline' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	icon?: string;
	onPress?: () => void;
	disabled?: boolean;
};

export default function Button({ label, theme = 'primary', size = 'md', icon, onPress, disabled }: Props) {
	const colors = useColors();
	const spacing = useSpacing();
	const radius = useRadius();
	const typography = useTypography();
	const elevation = useElevation();

	// Button size configurations
	const sizeConfig = {
		sm: { height: 36, paddingHorizontal: spacing.md, fontSize: typography.fontSize.sm },
		md: { height: 50, paddingHorizontal: spacing.lg, fontSize: typography.fontSize.base },
		lg: { height: 56, paddingHorizontal: spacing.xl, fontSize: typography.fontSize.lg },
	};

	// Theme configurations
	const getThemeStyles = () => {
		switch (theme) {
			case 'primary':
				return {
					backgroundColor: disabled ? colors.textLight : colors.primary,
					borderColor: disabled ? colors.textLight : colors.primary,
					textColor: colors.textInverse,
					borderWidth: 0,
				};
			case 'secondary':
				return {
					backgroundColor: disabled ? colors.borderLight : colors.accent,
					borderColor: disabled ? colors.borderLight : colors.accent,
					textColor: colors.textInverse,
					borderWidth: 0,
				};
			case 'outline':
				return {
					backgroundColor: 'transparent',
					borderColor: disabled ? colors.borderLight : colors.primary,
					textColor: disabled ? colors.textLight : colors.primary,
					borderWidth: 1,
				};
			case 'danger':
				return {
					backgroundColor: disabled ? colors.borderLight : colors.error,
					borderColor: disabled ? colors.borderLight : colors.error,
					textColor: colors.textInverse,
					borderWidth: 0,
				};
			default:
				return {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
					textColor: colors.textInverse,
					borderWidth: 0,
				};
		}
	};

	const themeStyles = getThemeStyles();
	const sizeStyles = sizeConfig[size];

	return (
		<Pressable
			onPress={disabled ? undefined : onPress}
			disabled={disabled}
			hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			android_ripple={!disabled ? { 
				color: themeStyles.textColor === colors.textInverse ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
				borderless: false 
			} : undefined}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: themeStyles.backgroundColor,
					borderColor: themeStyles.borderColor,
					borderWidth: themeStyles.borderWidth,
					height: sizeStyles.height,
					paddingHorizontal: sizeStyles.paddingHorizontal,
					borderRadius: radius.lg,
					opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
					transform: pressed && !disabled ? [{ scale: 0.98 }] : [{ scale: 1 }],
				},
				!disabled && elevation.md,
			]}
		>
			{icon && (
				<FontAwesome
					name={icon as any}
					size={sizeStyles.fontSize}
					color={themeStyles.textColor}
					style={{ marginRight: spacing.sm }}
				/>
			)}
			<Text
				style={[
					styles.buttonLabel,
					{
						color: themeStyles.textColor,
						fontSize: sizeStyles.fontSize,
						fontWeight: typography.fontWeight.semibold,
					},
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		minWidth: 120,
	},
	buttonLabel: {
		textAlign: 'center',
		fontWeight: '600',
	},
});
