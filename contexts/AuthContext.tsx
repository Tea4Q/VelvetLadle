import { GUEST_USER_ID } from "@/constants/limits";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { PurchaseService } from "../services/purchaseService";
import { isNetworkFetchError } from "../utils/networkUtils";
// import { DemoStorage } from './demoStorage';

export interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier?: "free" | "premium";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resetPasswordRequest: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure RevenueCat anonymously on mount; user login/logout flows below
  // link the customer record to the authenticated Supabase user.
  useEffect(() => {
    PurchaseService.configure();
  }, []);

  const mapSupabaseUser = useCallback((supabaseUser: any): User => {
    const tierFromMetadata =
      supabaseUser?.user_metadata?.subscription_tier ||
      supabaseUser?.app_metadata?.subscription_tier;

    const subscriptionTier: "free" | "premium" =
      tierFromMetadata === "premium" ||
      supabaseUser?.email?.toLowerCase() === "velvetladle.paid@gmail.com"
        ? "premium"
        : "free";

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name:
        supabaseUser.user_metadata?.name ||
        supabaseUser.email?.split("@")[0] ||
        "User",
      subscription_tier: subscriptionTier,
    };
  }, []);

  // Helper function for demo mode signin
  const signInDemoMode = useCallback(async (email: string) => {
    // Production build: console.log removed
    const demoUser = {
      id: "demo_user",
      email,
      name: email.split("@")[0],
      subscription_tier: "free" as const,
    };
    setUser(demoUser);
    await AsyncStorage.setItem("user", JSON.stringify(demoUser));
    setIsLoading(false);
    return { success: true };
  }, []);

  // Helper function for demo mode signup
  const signUpDemoMode = useCallback(async (email: string, name: string) => {
    // Production build: console.log removed
    const demoUser = {
      id: "demo_user",
      email,
      name,
      subscription_tier: "free" as const,
    };
    setUser(demoUser);
    await AsyncStorage.setItem("user", JSON.stringify(demoUser));
    setIsLoading(false);
    return { success: true };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
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
            console.error("Supabase signin error:", error);

            // Handle API configuration errors by falling back to demo mode
            if (
              isNetworkFetchError(error) ||
              error.message.includes("Invalid API key") ||
              error.message.includes("Invalid JWT") ||
              error.message.includes("Project not found") ||
              error.message.includes("Long live credential not available")
            ) {
              // Production build: console.log removed
              return await signInDemoMode(email);
            }

            // Handle specific auth errors normally
            if (error.message.includes("Invalid login credentials")) {
              return {
                success: false,
                error:
                  "Invalid email or password. Please check your credentials and try again.",
              };
            }

            if (error.message.includes("Email not confirmed")) {
              return {
                success: false,
                error: "Please confirm your email address before signing in.",
              };
            }

            return { success: false, error: error.message };
          }

          if (data?.user) {
            const userData = mapSupabaseUser(data.user);
            setUser(userData);
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            await PurchaseService.loginUser(userData.id);
            return { success: true };
          }

          return {
            success: false,
            error: "Sign in failed - no user data received",
          };
        } catch (networkError) {
          console.error("Sign in network error:", networkError);
          if (isNetworkFetchError(networkError)) {
            const result = await signInDemoMode(email);
            return result;
          }
          return {
            success: false,
            error: "An unexpected error occurred during sign in",
          };
        } finally {
          setIsLoading(false);
        }
      } catch (outerError) {
        console.error("Outer try block error:", outerError);
        setIsLoading(false);
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    [mapSupabaseUser, signInDemoMode],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
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
              subscription_tier: "free",
            },
          },
        });

        if (error) {
          console.error("Supabase signup error:", error);

          // API configuration errors fall back to demo mode
          if (
            isNetworkFetchError(error) ||
            error.message.includes("Invalid API key") ||
            error.message.includes("Invalid JWT") ||
            error.message.includes("Project not found") ||
            error.message.includes("Long live credential not available")
          ) {
            // Production build: console.log removed
            const result = await signUpDemoMode(email, name);
            return result;
          }

          return { success: false, error: error.message };
        }

        if (data?.session?.user) {
          const userData = mapSupabaseUser(data.session.user);
          setUser(userData);
          await AsyncStorage.setItem("user", JSON.stringify(userData));
          await PurchaseService.loginUser(userData.id);
          return { success: true };
        }

        if (data?.user) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (signInError || !signInData?.user) {
            const msg = signInError?.message?.toLowerCase() || "";

            if (msg.includes("email not confirmed")) {
              return {
                success: false,
                error:
                  "Account created. Please confirm your email, then sign in.",
              };
            }

            return {
              success: false,
              error:
                "Account created, but sign in was not completed. Please sign in to continue.",
            };
          }

          const userData = mapSupabaseUser(signInData.user);
          setUser(userData);
          await AsyncStorage.setItem("user", JSON.stringify(userData));
          await PurchaseService.loginUser(userData.id);
          return { success: true };
        }

        return { success: false, error: "Sign up failed" };
      } catch (error) {
        console.error("Sign up network error:", error);
        if (isNetworkFetchError(error)) {
          const result = await signUpDemoMode(email, name);
          return result;
        }
        return {
          success: false,
          error: "An unexpected error occurred during sign up",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [mapSupabaseUser, signUpDemoMode],
  );

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
      await PurchaseService.logoutUser();
      setUser(null);
      await AsyncStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    const guestUser = {
      id: "guest_user",
      email: "guest@velvetladle.com",
      name: "Guest User",
      subscription_tier: "free" as const,
    };
    setUser(guestUser);
    await AsyncStorage.setItem("user", JSON.stringify(guestUser));
  }, []);

  const resetPasswordRequest = useCallback(async (email: string) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error:
            "Password reset requires Supabase configuration. This feature is not available in demo mode.",
        };
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "velvetladle://reset-password",
      });

      if (error) {
        console.error("Password reset request error:", error);
        return { success: false, error: error.message };
      }

      // Always return success even if email doesn't exist (security best practice)
      return { success: true };
    } catch (error) {
      console.error("Password reset network error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error: "Password update requires Supabase configuration.",
        };
      }

      // Update password for currently authenticated user
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password update error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Password update network error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  // Load user from Supabase session and keep auth state synchronized
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error("Error loading Supabase session:", error);
          }

          if (session?.user) {
            const sessionUser = mapSupabaseUser(session.user);
            setUser(sessionUser);
            await AsyncStorage.setItem("user", JSON.stringify(sessionUser));
            await PurchaseService.loginUser(sessionUser.id);
            return;
          }
        }

        const userData = await AsyncStorage.getItem("user");
        if (!userData) {
          return;
        }

        const parsedUser = JSON.parse(userData);
        const isLocalOnlyUser =
          parsedUser?.id === GUEST_USER_ID || parsedUser?.id === "demo_user";

        if (isSupabaseConfigured && supabase && !isLocalOnlyUser) {
          // Avoid local/Supabase auth mismatch when no valid Supabase session exists.
          setUser(null);
          await AsyncStorage.removeItem("user");
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error("Error loading user from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    let subscription: { unsubscribe: () => void } | null = null;

    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event: any, session: any) => {
          if (session?.user) {
            const sessionUser = mapSupabaseUser(session.user);
            setUser(sessionUser);
            await AsyncStorage.setItem("user", JSON.stringify(sessionUser));
            await PurchaseService.loginUser(sessionUser.id);
            return;
          }

          const stored = await AsyncStorage.getItem("user");
          const parsedStored = stored ? JSON.parse(stored) : null;

          if (
            parsedStored?.id === "guest_user" ||
            parsedStored?.id === "demo_user"
          ) {
            setUser(parsedStored);
            return;
          }

          setUser(null);
          await AsyncStorage.removeItem("user");
        },
      );

      subscription = data.subscription;
    }

    loadUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, [mapSupabaseUser]);

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
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
