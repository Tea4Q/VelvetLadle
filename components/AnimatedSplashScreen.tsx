import { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { useColors } from "../contexts/ThemeContext";

export default function AnimatedSplashScreen() {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require("../assets/images/veveltLifeSplashImage.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Animated.Text
                style={[styles.logoText, { color: colors.secondary }]}
              >
                VL
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.appName, { color: colors.primary }]}>
              Velvet Ladle
            </Animated.Text>
          </Animated.View>

          <LoadingDots />
        </View>
      </ImageBackground>
    </View>
  );
}

// Loading dots component
function LoadingDots() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot1, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary, opacity: dot1 }]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary, opacity: dot2 }]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary, opacity: dot3 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    bottom: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
