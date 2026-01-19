// Simple Authentication Service for VelvetLadle
// This is a basic implementation - in production you'd use a real auth provider

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GUEST_USER_ID } from '../constants/limits';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

class AuthService {
  private static readonly USER_KEY = 'velvet_ladle_user';
  private static readonly AUTH_KEY = 'velvet_ladle_auth';

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const authData = await AsyncStorage.getItem(this.AUTH_KEY);
      return authData === 'true';
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        // Convert createdAt back to Date object
        user.createdAt = new Date(user.createdAt);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign in with email and password (mock implementation)
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation (in real app, this would be server-side)
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Create mock user
      const user: User = {
        id: `user_${Date.now()}`,
        name: this.getNameFromEmail(email),
        email: email.toLowerCase(),
        createdAt: new Date(),
      };

      // Save auth state and user data
      await AsyncStorage.setItem(this.AUTH_KEY, 'true');
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  }

  // Sign up with email and password
  static async signUp(name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate inputs
      if (!name || !email || !password) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        // Fallback to mock implementation if Supabase not configured
        console.warn('Supabase not configured, using mock auth');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create mock user
        const user: User = {
          id: `user_${Date.now()}`,
          name: name.trim(),
          email: email.toLowerCase(),
          createdAt: new Date(),
        };

        // Save auth state and user data
        await AsyncStorage.setItem(this.AUTH_KEY, 'true');
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

        return { success: true, user };
      }

      // Use Supabase Auth for real account creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (authError) {
        console.error('Supabase signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Account creation failed. Please try again.' };
      }

      // Create user object
      const user: User = {
        id: authData.user.id,
        name: name.trim(),
        email: authData.user.email || email.toLowerCase(),
        createdAt: new Date(authData.user.created_at),
      };

      // Save auth state and user data locally
      await AsyncStorage.setItem(this.AUTH_KEY, 'true');
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  }

  // Sign in as guest
  static async signInAsGuest(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user: User = {
        id: GUEST_USER_ID,
        name: 'Guest Chef',
        email: 'guest@velvetladle.app',
        createdAt: new Date(),
      };

      // Save auth state and user data
      await AsyncStorage.setItem(this.AUTH_KEY, 'true');
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      console.error('Error signing in as guest:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Sign out
  static async signOut(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.AUTH_KEY);
      await AsyncStorage.removeItem(this.USER_KEY);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }

  // Helper methods
  private static getNameFromEmail(email: string): string {
    const username = email.split('@')[0];
    // Capitalize first letter and remove numbers/special chars
    return username.charAt(0).toUpperCase() + username.slice(1).replace(/[^a-zA-Z]/g, '');
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if current user is a guest
  static async isCurrentUserGuest(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.id === GUEST_USER_ID;
    } catch (error) {
      console.error('Error checking guest status:', error);
      return false;
    }
  }

  // Get auth statistics
  static async getAuthStats(): Promise<{ hasAccount: boolean; isGuest: boolean; signUpDate?: Date }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { hasAccount: false, isGuest: false };
      }

      return {
        hasAccount: true,
        isGuest: user.id === GUEST_USER_ID,
        signUpDate: user.createdAt,
      };
    } catch (error) {
      console.error('Error getting auth stats:', error);
      return { hasAccount: false, isGuest: false };
    }
  }
}

export default AuthService;
