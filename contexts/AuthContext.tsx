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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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
    return { success: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Production build: console.log removed
    // Production build: console.log removed
    
    // Critical dual storage pattern - check configuration first
    if (!isSupabaseConfigured || !supabase) {
      return await signInDemoMode(email);
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
      return await signInDemoMode(email);
    }
  }, [signInDemoMode]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    // Critical dual storage pattern
    if (!isSupabaseConfigured || !supabase) {
      return await signUpDemoMode(email, name);
    }

    try {
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
          return await signUpDemoMode(email, name);
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
      return await signUpDemoMode(email, name);
    }
  }, [signUpDemoMode]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // Production build: console.log removed
      }
    }
    setUser(null);
    await AsyncStorage.removeItem('user');
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
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        signIn, 
        signUp, 
        signOut, 
        signInAsGuest 
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
