import React from 'react';
import { View, StyleSheet } from 'react-native';
import ImageLoadTest from '../../components/ImageLoadTest';
import { useTheme } from '../../contexts/ThemeContext';

export default function TestImagesScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ImageLoadTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
