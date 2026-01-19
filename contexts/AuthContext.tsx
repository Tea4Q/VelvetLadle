import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import { router } from 'expo-router';
import AuthService, { AuthState } from '../services/AuthService';

interface AuthContextType extends AuthState {
	signIn: (
		email: string,
		password: string
	) => Promise<{ success: boolean; error?: string }>;
	signUp: (
		name: string,
		email: string,
		password: string
	) => Promise<{ success: boolean; error?: string }>;
	signInAsGuest: () => Promise<{ success: boolean; error?: string }>;
	signOut: () => Promise<boolean>;
	refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [authState, setAuthState] = useState<AuthState>({
		isAuthenticated: false,
		user: null,
		isLoading: true,
	});

	// Initialize auth state on app load
	const initializeAuth = async () => {
		try {
			const isAuthenticated = await AuthService.isAuthenticated();
			const user = isAuthenticated ? await AuthService.getCurrentUser() : null;

			setAuthState({
				isAuthenticated,
				user,
				isLoading: false,
			});
		} catch (error) {
			console.error('Error initializing auth:', error);
			setAuthState({
				isAuthenticated: false,
				user: null,
				isLoading: false,
			});
		}
	};

	useEffect(() => {
		initializeAuth();
	}, []);

	const signIn = async (email: string, password: string) => {
		setAuthState((prev) => ({ ...prev, isLoading: true }));

		const result = await AuthService.signIn(email, password);

		if (result.success && result.user) {
			setAuthState({
				isAuthenticated: true,
				user: result.user,
				isLoading: false,
			});
			return { success: true };
		} else {
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error };
		}
	};

	const signUp = async (name: string, email: string, password: string) => {
		setAuthState((prev) => ({ ...prev, isLoading: true }));

		const result = await AuthService.signUp(name, email, password);

		if (result.success && result.user) {
			setAuthState({
				isAuthenticated: true,
				user: result.user,
				isLoading: false,
			});
			return { success: true };
		} else {
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error };
		}
	};

	const signInAsGuest = async () => {
		setAuthState((prev) => ({ ...prev, isLoading: true }));

		const result = await AuthService.signInAsGuest();

		if (result.success && result.user) {
			setAuthState({
				isAuthenticated: true,
				user: result.user,
				isLoading: false,
			});
			// Navigate to main app after successful authentication
			router.replace('/(tabs)');
			return { success: true };
		} else {
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error };
		}
	};

	const signOut = async () => {
		setAuthState((prev) => ({ ...prev, isLoading: true }));

		const success = await AuthService.signOut();

		setAuthState({
			isAuthenticated: false,
			user: null,
			isLoading: false,
		});

		return success;
	};

	const refreshAuth = async () => {
		await initializeAuth();
	};

	const contextValue: AuthContextType = {
		...authState,
		signIn,
		signUp,
		signInAsGuest,
		signOut,
		refreshAuth,
	};

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};
