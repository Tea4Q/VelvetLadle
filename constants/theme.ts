// VelvetLadle App Theme
export const theme = {
	colors: {
		// Primary Colors
		primary: '#00205B', // Deep Navy Blue (main brand color)
		primaryLight: '#3e5f9e', // Lighter navy for accents
		primaryDark: '#001840', // Darker navy for emphasis

		// Secondary Colors
		secondary: '#faf4eb', // Warm Cream (background)
		secondaryLight: '#ffffff', // Pure white for cards/surfaces
		secondaryDark: '#f0e8d8', // Slightly darker cream

		// Accent Colors
		accent: '#8B3A3A', // Rosewood Red
		accentLight: '#D4B4C3', // Dusty Mauve
		accentDark: '#D4AF37', // Metallic Gold

		// Status Colors
		success: '#4CAF50', // Green for success states
		warning: '#FF9800', // Orange for warnings
		error: '#F44336', // Red for errors
		info: '#2196F3', // Blue for info

		// Text Colors
		textPrimary: '#00205B', // Main text (navy)
		textSecondary: '#666666', // Secondary text (gray)
		textLight: '#999999', // Light text
		textInverse: '#ffffff', // White text for dark backgrounds

		// Surface Colors
		surface: '#ffffff', // Card/surface background
		background: '#faf4eb', // Main background
		overlay: 'rgba(0, 32, 91, 0.5)', // Semi-transparent overlay

		// Border Colors
		border: '#00205B', // Primary borders
		borderLight: '#E0E0E0', // Light borders
		borderAccent: '#C8A882', // Accent borders

		// Shadow Colors
		shadow: 'rgba(0, 0, 0, 0.1)', // Light shadow
		shadowMedium: 'rgba(0, 0, 0, 0.2)', // Medium shadow
		shadowDark: 'rgba(0, 0, 0, 0.3)', // Dark shadow
	},

	// Typography
	typography: {
		fontFamily: {
			regular: 'Nunito ', // Default system font
			bold: 'Nunito -Bold', // Bold font
			mono: 'Nunito', // You have this font in assets
		},
		fontSize: {
			xs: 12,
			sm: 14,
			base: 16,
			lg: 18,
			xl: 20,
			'2xl': 24,
			'3xl': 28,
			'4xl': 32,
		},
		fontWeight: {
			normal: '400',
			medium: '500',
			semibold: '600',
			bold: '700',
		},
	},

	// Spacing
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 20,
		'2xl': 24,
		'3xl': 32,
		'4xl': 40,
		'5xl': 48,
	},

	// Border Radius
	radius: {
		sm: 4,
		md: 8,
		lg: 10,
		xl: 12,
		'2xl': 16,
		full: 9999,
	},

	// Opacity
	opacity: {
		disabled: 0.5,
		overlay: 0.8,
		subtle: 0.6,
		medium: 0.7,
	},

	// Elevation/Shadow presets
	elevation: {
		sm: {
			shadowColor: 'rgba(0, 0, 0, 0.1)',
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 1,
			shadowRadius: 2,
			elevation: 2,
		},
		md: {
			shadowColor: 'rgba(0, 0, 0, 0.1)',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 1,
			shadowRadius: 4,
			elevation: 3,
		},
		lg: {
			shadowColor: 'rgba(0, 0, 0, 0.15)',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 1,
			shadowRadius: 8,
			elevation: 5,
		},
	},
} as const;

// Helper function to get theme colors with opacity
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // If it's already an rgba color, return as is
  if (color.startsWith('rgba')) return color;
  
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return color;
};

// Type definitions for better TypeScript support
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeRadius = typeof theme.radius;
export type ThemeTypography = typeof theme.typography;
