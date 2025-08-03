import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import ImageViewer from '../components/imageViewer';
import * as SplashScreen from 'expo-splash-screen';

// Use the dedicated splash illustration
const logoImage = require('../assets/images/splashIllustration.png');

interface AnimatedSplashScreenProps {
  onAnimationFinish?: () => void;
}

const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 200),
      createDotAnimation(dot3Anim, 400),
    ]).start();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: color, opacity: dot1Anim }
        ]}
      />
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: color, opacity: dot2Anim }
        ]}
      />
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: color, opacity: dot3Anim }
        ]}
      />
    </View>
  );
};

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationFinish }) => {
  const colors = useColors();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Keep the native splash screen visible while we prepare our custom animation
    SplashScreen.preventAutoHideAsync();

    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Phase 1: Logo appears with scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Text slides up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Phase 3: Brief pause before finishing
      Animated.delay(1200),
    ]);

    animationSequence.start(() => {
      // Hide the native splash screen
      SplashScreen.hideAsync();
      // Call the finish callback
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });

    return () => {
      SplashScreen.hideAsync();
    };
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationFinish]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background gradient effect */}
      <View style={[styles.backgroundGradient, { backgroundColor: colors.primary }]} />
      
      {/* Logo with animations */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <ImageViewer imgSource={logoImage} />
        </View>
      </Animated.View>

      {/* App title with slide animation */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Velvet Ladle
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your culinary companion
        </Text>
      </Animated.View>

      {/* Animated loading indicator */}
      <Animated.View
        style={[
          styles.loadingWrapper,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <LoadingDots color={colors.accent} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  logoContainer: {
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  logoWrapper: {
    width: 240,  // Larger, more prominent
    height: 240, // Square for better proportion
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white', // Ensure background for image
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  loadingWrapper: {
    position: 'absolute',
    bottom: 120,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default AnimatedSplashScreen;
