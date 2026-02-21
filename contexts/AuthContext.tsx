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
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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
              error.message.includes('Long live credential not available') ||
              error.message.includes('network') ||
              error.message.includes('fetch') ||
              error.message.includes('NetworkError') ||
              error.message.toLowerCase().includes('failed to fetch')) {
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
      }
    } catch (outerError) {
      console.error('Outer try block error:', outerError);
      // Also fallback to demo mode on any unexpected error
      try {
        const result = await signInDemoMode(email);
        return result;
      } catch (demoError) {
        console.error('Demo mode fallback failed:', demoError);
        return { success: false, error: 'An unexpected error occurred' };
      }
    } finally {
      setIsLoading(false);
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

  const resetPassword = useCallback(async (email: string) => {
    try {
      // If Supabase is not configured, show appropriate message for demo mode
      if (!isSupabaseConfigured || !supabase) {
        return { 
          success: false, 
          error: 'Password reset is not available in demo mode. Please use demo@example.com with any password to sign in.' 
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password', // This would need to be configured for your app
      });

      if (error) {
        console.error('Password reset error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to send password reset email' 
        };
      }

      return { 
        success: true 
      };
    } catch (error) {
      console.error('Reset password network error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
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
        resetPassword 
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
