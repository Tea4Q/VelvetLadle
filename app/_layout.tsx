import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { PostHogProvider } from "posthog-react-native";
import React, { Component, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>Something went wrong</Text>
          {__DEV__ && this.state.error ? (
            <Text style={{ fontSize: 12, color: "#c00", textAlign: "center", marginBottom: 8 }}>
              {this.state.error.message}
            </Text>
          ) : null}
          {__DEV__ && this.state.error?.stack ? (
            <Text style={{ fontSize: 10, color: "#888", textAlign: "left" }}>
              {this.state.error.stack.slice(0, 500)}
            </Text>
          ) : null}
          <Text style={{ fontSize: 11, color: "#aaa", marginTop: 12 }}>Please restart the app</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Keep splash screen visible while we fetch resources

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    // Add your fonts here if any
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced loading time
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the app to render
        setIsReady(true);
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  if (!isReady || !fontsLoaded) {
    // Just show native splash screen, no custom component
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="account"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen name="upgrade" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey="phc_m8EjrNKBB48SJowOLM4JLctQPlrHglzs63fqvCWkz2m"
      options={{
        host: "https://us.i.posthog.com",
        enableSessionReplay: !__DEV__,
        sessionReplayConfig: {
          maskAllTextInputs: true,
          maskAllImages: true,
          captureLog: true,
          captureNetworkTelemetry: true,
          sampleRate: undefined,
          throttleDelayMs: 1000,
        },
      }}
    >
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </PostHogProvider>
  );
}
