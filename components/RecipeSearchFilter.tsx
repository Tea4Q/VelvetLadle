import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors, useRadius, useSpacing, useTypography } from '../contexts/ThemeContext';
import Button from './buttons';

type Props = {
  onSearch: (searchTerm: string, selectedIngredients: string[], selectedCuisines: string[]) => void;
  onClear: () => void;
  availableIngredients: string[];
  availableCuisines: string[];
  initialSearchTerm?: string;
  initialIngredients?: string[];
  initialCuisines?: string[];
};

export default function RecipeSearchFilter({ 
  onSearch, 
  onClear, 
  availableIngredients, 
  availableCuisines,
  initialSearchTerm = '',
  initialIngredients = [],
  initialCuisines = []
}: Props) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(initialIngredients);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialCuisines);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCuisines, setShowCuisines] = useState(false);

  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  const radius = useRadius();

  // Helper function to clean ingredient names by removing units and common words
  const cleanIngredientName = (ingredient: string): string | null => {
    // First, remove measurement units that appear after numbers
    const unitPattern = /\d+(\.\d+)?\s*(g|kg|oz|ml|l|1\/2|1\/4|3\/4|cup|cups|pound|pounds|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|whole|ounces?|lb|gram|grams|milliliter|liter|liters)\.?\s*/gi;
    
    // Then, remove common words that we don't want in the ingredient names
    const wordPattern = /\b(fresh|dried|frozen|chopped|minced|diced|sliced|grated|crushed|ground|peeled|pitted|cored|cubed|julienned|1\/4|1\/2|3\/4|cube|cup|cups|Large|Ounces|Pounds|Tablespoon|Tablespoons|Teaspoon|Teaspoons|Tsp|Whole|shredded|melted|softened|room temperature|ripe|unripe|raw|cooked|boiled|baked|roasted|toasted|pureed|sifted)\b\s*/gi;
    
    // Apply both patterns sequentially
    let cleaned = ingredient.replace(unitPattern, '');
    cleaned = cleaned.replace(wordPattern, '');
    
    // Final trim to remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Return null for empty ingredients so they can be filtered out
    return cleaned === '' ? null : cleaned;
  };

  // Trigger search when component mounts with initial values
  useEffect(() => {
    if (initialCuisines.length > 0 || initialIngredients.length > 0 || initialSearchTerm) {
      onSearch(searchTerm, selectedIngredients, selectedCuisines);
    }
  }, []); // Remove all dependencies to run only once on mount

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSearch = () => {
    onSearch(searchTerm, selectedIngredients, selectedCuisines);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedIngredients([]);
    setSelectedCuisines([]);
    onClear();
  };

  const hasActiveFilters = searchTerm.length > 0 || selectedIngredients.length > 0 || selectedCuisines.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, padding: spacing.lg }]}>
      {/* Search Input */}
      <View style={styles.searchSection}>
        <Text style={[styles.sectionTitle, { 
          color: colors.textPrimary, 
          fontSize: typography.fontSize.lg,
          marginBottom: spacing.sm 
        }]}>
          🔍 Search Recipes
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
              fontSize: typography.fontSize.base,
              color: colors.textPrimary,
            }
          ]}
          placeholder="Search by recipe title or description..."
          placeholderTextColor={colors.textLight}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Ingredient Filter */}
      <View style={[styles.filterSection, { marginTop: spacing.lg }]}>
        <TouchableOpacity 
          style={styles.filterHeader}
          onPress={() => setShowIngredients(!showIngredients)}
        >
          <Text style={[styles.sectionTitle, { 
            color: colors.textPrimary, 
            fontSize: typography.fontSize.lg 
          }]}>
            🥕 Filter by Ingredients ({selectedIngredients.length})
          </Text>
          <Text style={[styles.toggleIcon, { color: colors.textSecondary }]}>
            {showIngredients ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showIngredients && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.tagContainer, { marginTop: spacing.sm }]}
          >
            {availableIngredients
              .filter(ingredient => {
                const cleaned = cleanIngredientName(ingredient);
                return cleaned !== null && cleaned.trim() !== '';
              })
              .map((ingredient) => (
              <TouchableOpacity
                key={ingredient}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selectedIngredients.includes(ingredient) 
                      ? colors.accent 
                      : colors.background,
                    borderColor: selectedIngredients.includes(ingredient)
                      ? colors.accent
                      : colors.borderLight,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginRight: spacing.sm,
                  }
                ]}
                onPress={() => toggleIngredient(ingredient)}
              >
                <Text style={[
                  styles.tagText,
                  {
                    color: selectedIngredients.includes(ingredient) 
                      ? colors.textInverse 
                      : colors.textPrimary,
                    fontSize: typography.fontSize.sm,
                  }
                ]}>
                  {cleanIngredientName(ingredient) || ingredient}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Cuisine Filter */}
      <View style={[styles.filterSection, { marginTop: spacing.lg }]}>
        <TouchableOpacity 
          style={styles.filterHeader}
          onPress={() => setShowCuisines(!showCuisines)}
        >
          <Text style={[styles.sectionTitle, { 
            color: colors.textPrimary, 
            fontSize: typography.fontSize.lg 
          }]}>
            🌍 Filter by Cuisine ({selectedCuisines.length})
          </Text>
          <Text style={[styles.toggleIcon, { color: colors.textSecondary }]}>
            {showCuisines ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showCuisines && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.tagContainer, { marginTop: spacing.sm }]}
          >
            {availableCuisines.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selectedCuisines.includes(cuisine) 
                      ? colors.primary 
                      : colors.background,
                    borderColor: selectedCuisines.includes(cuisine)
                      ? colors.primary
                      : colors.borderLight,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginRight: spacing.sm,
                  }
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={[
                  styles.tagText,
                  {
                    color: selectedCuisines.includes(cuisine) 
                      ? colors.textInverse 
                      : colors.textPrimary,
                    fontSize: typography.fontSize.sm,
                  }
                ]}>
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { 
        marginTop: spacing.xl,
        flexDirection: 'row',
        gap: spacing.md 
      }]}>
        <Button
          label="Search"
          theme="primary"
          onPress={handleSearch}
          icon="search"
        />
        {hasActiveFilters && (
          <Button
            label="Clear All"
            theme="outline"
            onPress={handleClear}
            icon="times"
          />
        )}
      </View>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View style={[styles.summary, { 
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.background,
          borderRadius: radius.md 
        }]}>
          <Text style={[styles.summaryTitle, { 
            color: colors.textPrimary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.xs 
          }]}>
            Active Filters:
          </Text>
          {searchTerm && (
            <Text style={[styles.summaryText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              • Search: {searchTerm}
            </Text>
          )}
          {selectedIngredients.length > 0 && (
            <Text style={[styles.summaryText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              • Ingredients: {selectedIngredients
                .map(ing => cleanIngredientName(ing) || ing)
                .filter(ing => ing && ing.trim() !== '')
                .join(', ')}
            </Text>
          )}
          {selectedCuisines.length > 0 && (
            <Text style={[styles.summaryText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              • Cuisines: {selectedCuisines.join(', ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchSection: {
    // Dynamic styles applied inline
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    height: 44,
  },
  filterSection: {
    // Dynamic styles applied inline
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 16,
  },
  tagContainer: {
    // Dynamic styles applied inline
  },
  tag: {
    borderWidth: 1,
  },
  tagText: {
    // Dynamic styles applied inline
  },
  buttonContainer: {
    // Dynamic styles applied inline
  },
  summary: {
    // Dynamic styles applied inline
  },
  summaryTitle: {
    // Dynamic styles applied inline
  },
  summaryText: {
    // Dynamic styles applied inline
  },
});
