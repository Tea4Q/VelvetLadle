import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// Choose splash image based on device orientation and size
const getSplashImage = () => {
  if (width > height) {
    // Landscape
    return require('../assets/images/Velvet_Ladle_Splash_Android_Mid_1920x1080.png');
  } else if (width > 768) {
    // Tablet portrait
    return require('../assets/images/Velvet_Ladle_Splash_Tablet_2048x1536.png');
  } else {
    // Mobile portrait
    return require('../assets/images/Velvet_Ladle_Splash_Android_Mid_1920x1080.png');
  }
};

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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Keep the native splash screen visible while we prepare our custom animation
    SplashScreen.preventAutoHideAsync();

    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Phase 1: Fade in the background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
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
  }, [fadeAnim, slideAnim, onAnimationFinish]);

  return (
    <View style={styles.container}>
      {/* Full background splash image */}
      <ImageBackground
        source={getSplashImage()}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Semi-transparent overlay for text readability */}
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]} />
        
        {/* Content overlay */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* App title with slide animation */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.textInverse }]}>
              Velvet Ladle
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryLight }]}>
              Your culinary companion
            </Text>
          </Animated.View>

          {/* Animated loading indicator */}
          <View style={styles.loadingWrapper}>
            <LoadingDots color={colors.secondaryLight} />
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3, // Adjust for text readability
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default AnimatedSplashScreen;
