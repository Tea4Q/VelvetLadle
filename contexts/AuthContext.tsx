import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function for demo mode signin
  const signInDemoMode = useCallback(async (email: string) => {
    // Production build: console.log removed
    const demoUser = {
      id: 'demo_user',
      email,
      name: email.split('@')[0],
    };
    setUser(demoUser);
    await AsyncStorage.setItem('user', JSON.stringify(demoUser));
    setIsLoading(false);
    return { success: true };
  }, []);

  // Helper function for demo mode signup
  const signUpDemoMode = useCallback(async (email: string, name: string) => {
    // Production build: console.log removed
    const demoUser = {
      id: 'demo_user',
      email,
      name,
    };
    setUser(demoUser);
    await AsyncStorage.setItem('user', JSON.stringify(demoUser));
    setIsLoading(false);
    return { success: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Production build: console.log removed
    // Production build: console.log removed
    
    setIsLoading(true);
    
    try {
      // Critical dual storage pattern - check configuration first
      if (!isSupabaseConfigured || !supabase) {
        const result = await signInDemoMode(email);
        return result;
      }

    try {
      // Production build: console.log removed
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Production build: console.log removed
      
      if (error) {
        console.error('Supabase signin error:', error);
        
        // Handle API configuration errors by falling back to demo mode
        if (error.message.includes('Invalid API key') || 
            error.message.includes('Invalid JWT') ||
            error.message.includes('Project not found') ||
            error.message.includes('Long live credential not available')) {
          // Production build: console.log removed
          return await signInDemoMode(email);
        }
        
        // Handle specific auth errors normally
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid email or password. Please check your credentials and try again.' 
          };
        }

        return { success: false, error: error.message };
      }

      if (data?.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        };
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, error: 'Sign in failed - no user data received' };
    } catch (networkError) {
      console.error('Sign in network error:', networkError);
      // Network errors also fall back to demo mode
      // Production build: console.log removed
      const result = await signInDemoMode(email);
      return result;
    } finally {
      setIsLoading(false);
    }
  } catch (outerError) {
    console.error('Outer try block error:', outerError);
    setIsLoading(false);
    return { success: false, error: 'An unexpected error occurred' };
  }
  }, [signInDemoMode]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      // Critical dual storage pattern
      if (!isSupabaseConfigured || !supabase) {
        const result = await signUpDemoMode(email, name);
        return result;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
         
        // API configuration errors fall back to demo mode
        if (error.message.includes('Invalid API key') || 
            error.message.includes('Invalid JWT') ||
            error.message.includes('Project not found') ||
            error.message.includes('Long live credential not available')) {
          // Production build: console.log removed
          const result = await signUpDemoMode(email, name);
          return result;
        }
           
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: name,
        };
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      console.error('Sign up network error:', error);
      // Production build: console.log removed
      const result = await signUpDemoMode(email, name);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [signUpDemoMode]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          // Production build: console.log removed
        }
      }
      setUser(null);
      await AsyncStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    const guestUser = {
      id: 'guest_user',
      email: 'guest@velvetladle.com',
      name: 'Guest User',
    };
    setUser(guestUser);
    await AsyncStorage.setItem('user', JSON.stringify(guestUser));
  }, []);

  const resetPasswordRequest = useCallback(async (email: string) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error: 'Password reset requires Supabase configuration. This feature is not available in demo mode.',
        };
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'velvetladle://reset-password',
      });

      if (error) {
        console.error('Password reset request error:', error);
        return { success: false, error: error.message };
      }

      // Always return success even if email doesn't exist (security best practice)
      return { success: true };
    } catch (error) {
      console.error('Password reset network error:', error);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error: 'Password update requires Supabase configuration.',
        };
      }

      // Update password for currently authenticated user
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password update network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user,
        isLoading,
        signIn, 
        signUp, 
        signOut, 
        signInAsGuest,
        resetPasswordRequest,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
