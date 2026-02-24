import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { parseIngredients, scaleIngredients } from '../utils/ingredientParser';
import { useColors } from '../contexts/ThemeContext';

interface IngredientListProps {
  ingredients: string[];
  servings?: number;
  originalServings?: number;
}

export default function IngredientList({ ingredients, servings, originalServings }: IngredientListProps) {
  const colors = useColors();
  const [currentServings, setCurrentServings] = useState(servings || originalServings || 4);

  // Sync with parent servings changes
  useEffect(() => {
    if (servings !== undefined) {
      setCurrentServings(servings);
    }
  }, [servings]);

  // Parse ingredients into structured format
  const parsedIngredients = parseIngredients(ingredients);
  
  // Calculate scaling multiplier
  const baseServings = originalServings || servings || 4;
  const multiplier = currentServings / baseServings;
  
  // Scale ingredients if multiplier is not 1
  const displayIngredients = multiplier !== 1 
    ? scaleIngredients(parsedIngredients, multiplier)
    : parsedIngredients;

  const handleServingChange = (newServings: number) => {
    if (newServings > 0 && newServings <= 50) {
      setCurrentServings(newServings);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    servingControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 4,
    },
    servingButton: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    servingButtonText: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: 'bold',
    },
    servingText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
      marginHorizontal: 12,
      minWidth: 60,
      textAlign: 'center',
    },
    scalingInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
      marginBottom: 12,
    },
    scalingText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
    },
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      paddingVertical: 4,
    },
    bullet: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 12,
      marginTop: 2,
      minWidth: 20,
      textAlign: 'right',
    },
    ingredientContent: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
    },
    amount: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginRight: 6,
    },
    unit: {
      color: colors.textSecondary,
      fontSize: 15,
      marginRight: 6,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 15,
      flex: 1,
    },
    originalText: {
      color: colors.textPrimary,
      fontSize: 15,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Ingredients ({ingredients.length})
        </Text>
        
        {(originalServings || servings) && (
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => handleServingChange(currentServings - 1)}
            >
              <Text style={styles.servingButtonText}>−</Text>
            </TouchableOpacity>
            
            <Text style={styles.servingText}>
              {currentServings} servings
            </Text>
            
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => handleServingChange(currentServings + 1)}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {multiplier !== 1 && (
        <View style={styles.scalingInfo}>
          <Text style={styles.scalingText}>
            Scaled from {baseServings} to {currentServings} servings (×{multiplier.toFixed(2)})
          </Text>
        </View>
      )}

      {displayIngredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientItem}>
          <Text style={styles.bullet}>{index + 1}.</Text>
          
          <View style={styles.ingredientContent}>
            {ingredient.amount || ingredient.unit ? (
              <>
                {ingredient.amount && (
                  <Text style={styles.amount}>{ingredient.amount}</Text>
                )}
                {ingredient.unit && (
                  <Text style={styles.unit}>{ingredient.unit}</Text>
                )}
                <Text style={styles.name}>{ingredient.name}</Text>
              </>
            ) : (
              <Text style={styles.originalText}>{ingredient.original}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
