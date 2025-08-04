import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { RecipeSourceService, RecipeSource } from '../services/RecipeSourceService';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
};

export default function RecipeSourceInput({ value, onChangeText, placeholder, style }: Props) {
  const [suggestions, setSuggestions] = useState<RecipeSource[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const suppressBlur = useRef(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (value && value.length > 0) {
      loadFilteredSuggestions(value);
    } else if (isFocused) {
      loadSuggestions();
    }
  }, [value, isFocused]);

  const loadSuggestions = async () => {
    const sources = await RecipeSourceService.getSources();
    setSuggestions(sources);
  };

  const loadFilteredSuggestions = async (searchText: string) => {
    const filteredSources = await RecipeSourceService.getSuggestions(searchText);
    setSuggestions(filteredSources);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    loadSuggestions();
  };

  const handleBlur = () => {
    // Check if we should suppress the blur (during selection)
    if (suppressBlur.current) {
      suppressBlur.current = false;
      return;
    }
    
    setIsFocused(false);
    setShowSuggestions(false);
  };

  const selectSuggestion = (source: RecipeSource) => {
    // Suppress the blur event that might interfere
    suppressBlur.current = true;
    
    // Update the text field
    onChangeText(source.source);
    
    // Hide suggestions and reset states
    setShowSuggestions(false);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.textInput, style]}
        placeholder={placeholder || "e.g., Grandma's recipe, Found in old cookbook, From neighbor"}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        multiline={false}
        autoCapitalize="sentences"
        autoCorrect={true}
        spellCheck={true}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.suggestionsContent}
            indicatorStyle="default"
          >
            {suggestions.map((item, index) => (
              <Pressable
                key={`suggestion-${item.id}-${item.source}-${index}`}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  index === suggestions.length - 1 && { borderBottomWidth: 0 },
                  pressed && { backgroundColor: '#f0f0f0' }
                ]}
                onPress={() => selectSuggestion(item)}
              >
                <Text style={styles.suggestionText}>{item.source}</Text>
                <Text style={styles.suggestionCount}>Used {item.usageCount} time{item.usageCount !== 1 ? 's' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#00205B',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#00205B',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00205B',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 250, // Increased from 200 to show more suggestions
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    maxHeight: 250, // Increased from 200
  },
  suggestionsContent: {
    flexGrow: 1,
  },
  suggestionItem: {
    padding: 12, // Reduced from 15
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 50, // Reduced from 60
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: '#00205B',
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
