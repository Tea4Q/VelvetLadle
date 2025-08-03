import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import ImageViewer from '../components/imageViewer';
import { useColors } from '../contexts/ThemeContext';

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
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Keep the native splash screen visible while we prepare our custom animation
    SplashScreen.preventAutoHideAsync();

    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Phase 1: Logo appears with scale and rotation
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
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
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
      Animated.delay(1500),
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
  }, [fadeAnim, scaleAnim, slideAnim, logoRotateAnim, onAnimationFinish]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            transform: [
              { scale: scaleAnim },
              { rotate: logoRotation },
            ],
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
        <LoadingDots color={colors.secondary} />
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
    opacity: 0.1,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoWrapper: {
    width: 200,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  loadingWrapper: {
    position: 'absolute',
    bottom: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default AnimatedSplashScreen;