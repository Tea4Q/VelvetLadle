import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import IngredientList from './IngredientList';
import { useColors } from '../contexts/ThemeContext';

// Demo ingredients with various formats to test parsing
const demoRecipe = {
  title: "Classic Chocolate Chip Cookies",
  ingredients: [
    "2 1/4 cups all-purpose flour",
    "1 teaspoon baking soda", 
    "1 teaspoon salt",
    "1 cup butter, softened",
    "3/4 cup granulated sugar",
    "3/4 cup packed brown sugar",
    "2 large eggs",
    "2 teaspoons vanilla extract",
    "2 cups chocolate chips",
    "1 cup chopped walnuts (optional)",
    "Pinch of sea salt for sprinkling"
  ],
  servings: 48
};

const demoRecipe2 = {
  title: "Simple Pasta",
  ingredients: [
    "1 pound spaghetti",
    "4 tablespoons olive oil",
    "3 cloves garlic, minced",
    "1/2 teaspoon red pepper flakes",
    "Salt and black pepper to taste",
    "1/2 cup freshly grated Parmesan cheese",
    "Fresh basil leaves"
  ],
  servings: 4
};

const demoRecipe3 = {
  title: "Mixed Number Test Recipe",
  ingredients: [
    "1 1/4 cups flour",
    "1/3 cup sugar", 
    "2 1/2 teaspoons baking powder",
    "1/8 teaspoon salt",
    "3/4 cup milk",
    "1 2/3 cups chocolate chips"
  ],
  servings: 6
};

export default function IngredientDemo() {
  const colors = useColors();
  const [currentRecipe, setCurrentRecipe] = useState(demoRecipe);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    switchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      flex: 1,
    },
    switchButtonText: {
      color: colors.textInverse,
      textAlign: 'center',
      fontWeight: '500',
    },
    recipeTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    recipeSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ingredient Parser Demo</Text>
        <Text style={styles.subtitle}>
          Test the ingredient parsing and scaling functionality
        </Text>
        
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.switchButton}
            onPress={() => setCurrentRecipe(demoRecipe)}
          >
            <Text style={styles.switchButtonText}>Cookie Recipe</Text>
          </Pressable>
          
          <Pressable 
            style={styles.switchButton}
            onPress={() => setCurrentRecipe(demoRecipe2)}
          >
            <Text style={styles.switchButtonText}>Pasta Recipe</Text>
          </Pressable>
          
          <Pressable 
            style={styles.switchButton}
            onPress={() => setCurrentRecipe(demoRecipe3)}
          >
            <Text style={styles.switchButtonText}>Mixed Numbers</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.recipeTitle}>{currentRecipe.title}</Text>
      <Text style={styles.recipeSubtitle}>
        Original servings: {currentRecipe.servings} • Try adjusting the serving size
      </Text>
      
      <IngredientList 
        ingredients={currentRecipe.ingredients}
        servings={currentRecipe.servings}
        originalServings={currentRecipe.servings}
      />
    </ScrollView>
  );
}
