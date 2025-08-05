import React from 'react';
import { View, StyleSheet } from 'react-native';
import ImageLoadTest from '../components/ImageLoadTest';

/**
 * Test Page for Image Loading System
 * 
 * This page provides a comprehensive testing interface for the local image storage system.
 * Use this during development to test and debug image loading functionality.
 */
export default function TestImagePage() {
  return (
    <View style={styles.container}>
      <ImageLoadTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
