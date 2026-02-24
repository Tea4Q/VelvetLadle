import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
        await SplashScreen.hideAsync();
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
      <Stack.Screen name="test-images" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  console.log("SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log(
    "SUPABASE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8),
  );
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
