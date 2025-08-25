
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Recipe } from '../lib/supabase';
import Button from './buttons';
import SmartImage from './SmartImage';

interface RecipeFormProps {
  initialRecipe?: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

const defaultNutrition = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sugar: '',
  sodium: '',
};

export default function RecipeForm({ initialRecipe, onSave, onCancel }: RecipeFormProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'details' | 'nutrition' | 'notes'>('basics');
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [description, setDescription] = useState(initialRecipe?.description || '');
  const [imageUrl, setImageUrl] = useState(initialRecipe?.image_url || '');
  const [ingredients, setIngredients] = useState(initialRecipe?.ingredients?.join('\n') || '');
  const [directions, setDirections] = useState(initialRecipe?.directions?.join('\n') || '');
  const [servings, setServings] = useState(initialRecipe?.servings?.toString() || '');
  const [prepTime, setPrepTime] = useState(initialRecipe?.prep_time || '');
  const [cookTime, setCookTime] = useState(initialRecipe?.cook_time || '');
  const [totalTime, setTotalTime] = useState(initialRecipe?.total_time || '');
  const [cuisine, setCuisine] = useState(initialRecipe?.cuisine_type || '');
  const [difficulty, setDifficulty] = useState(initialRecipe?.difficulty_level || '');
  const [nutrition, setNutrition] = useState<any>(initialRecipe?.nutritional_info || defaultNutrition);
  const [personalNotes, setPersonalNotes] = useState(initialRecipe?.personal_notes || '');

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || '');
      setDescription(initialRecipe.description || '');
      setImageUrl(initialRecipe.image_url || '');
      setIngredients(initialRecipe.ingredients?.join('\n') || '');
      setDirections(initialRecipe.directions?.join('\n') || '');
      setServings(initialRecipe.servings?.toString() || '');
      setPrepTime(initialRecipe.prep_time || '');
      setCookTime(initialRecipe.cook_time || '');
      setTotalTime(initialRecipe.total_time || '');
      setCuisine(initialRecipe.cuisine_type || '');
      setDifficulty(initialRecipe.difficulty_level || '');
      setNutrition(initialRecipe.nutritional_info || defaultNutrition);
  setPersonalNotes(initialRecipe?.personal_notes || '');
    }
  }, [initialRecipe]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a recipe title.');
      return;
    }
    if (!ingredients.trim()) {
      Alert.alert('Missing Ingredients', 'Please enter at least one ingredient.');
      return;
    }
    if (!directions.trim()) {
      Alert.alert('Missing Directions', 'Please enter at least one direction.');
      return;
    }
    const recipe: Recipe = {
      ...initialRecipe,
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      ingredients: ingredients.split('\n').map(i => i.trim()).filter(Boolean),
      directions: directions.split('\n').map(d => d.trim()).filter(Boolean),
      servings: servings ? parseInt(servings) : undefined,
      prep_time: prepTime.trim(),
      cook_time: cookTime.trim(),
      total_time: totalTime.trim(),
      cuisine_type: cuisine.trim(),
      difficulty_level: difficulty.trim(),
      nutritional_info: nutrition,
  personal_notes: personalNotes.trim(),
      web_address: initialRecipe?.web_address || '',
      recipe_source: initialRecipe?.recipe_source || '',
    };
    onSave(recipe);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#faf4eb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
  <View style={{ flex: 1, minHeight: 0 }}>
      {/* Top Bar: Back, Save, Cancel */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingHorizontal: 10, backgroundColor: '#faf4eb', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          <Text style={{ fontSize: 20, color: '#00205B', marginRight: 4 }}>←</Text>
          <Text style={{ fontSize: 16, color: '#00205B', fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label="Save" theme="primary" onPress={handleSave} />
          <Button label="Cancel" onPress={onCancel} />
        </View>
      </View>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'basics' && styles.activeTab]} onPress={() => setActiveTab('basics')}>
          <Text style={[styles.tabText, activeTab === 'basics' && styles.activeTabText]}>Basics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'details' && styles.activeTab]} onPress={() => setActiveTab('details')}>
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]} onPress={() => setActiveTab('nutrition')}>
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>Nutrition</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'notes' && styles.activeTab]} onPress={() => setActiveTab('notes')}>
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notes</Text>
        </TouchableOpacity>
      </View>
      {/* Tab Content */}
  <ScrollView style={[styles.container, { flex: 1 }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === 'basics' && (
          <>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} />
            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />
            {imageUrl ? <SmartImage imageUrl={imageUrl} recipeId={initialRecipe?.id ?? 0} style={styles.image} /> : null}
            <Text style={styles.label}>Ingredients *</Text>
            <TextInput style={[styles.input, styles.multiline]} value={ingredients} onChangeText={setIngredients} multiline numberOfLines={3} />
            <Text style={styles.label}>Directions *</Text>
            <TextInput style={[styles.input, styles.multiline]} value={directions} onChangeText={setDirections} multiline numberOfLines={3} />
          </>
        )}
        {activeTab === 'details' && (
          <>
            <Text style={styles.label}>Servings</Text>
            <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" />
            <Text style={styles.label}>Prep Time</Text>
            <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} />
            <Text style={styles.label}>Cook Time</Text>
            <TextInput style={styles.input} value={cookTime} onChangeText={setCookTime} />
            <Text style={styles.label}>Total Time</Text>
            <TextInput style={styles.input} value={totalTime} onChangeText={setTotalTime} />
            <Text style={styles.label}>Cuisine</Text>
            <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} />
            <Text style={styles.label}>Difficulty</Text>
            <TextInput style={styles.input} value={difficulty} onChangeText={setDifficulty} />
          </>
        )}
        {activeTab === 'nutrition' && (
          <>
            <Text style={styles.sectionTitle}>Nutritional Info</Text>
            {Object.keys(defaultNutrition).map(key => (
              <View key={key} style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition[key] || ''}
                  onChangeText={val => setNutrition((n: any) => ({ ...n, [key]: val }))}
                  keyboardType={key === 'calories' || key === 'sodium' ? 'numeric' : 'default'}
                />
              </View>
            ))}
          </>
        )}
        {activeTab === 'notes' && (
          <>
            <Text style={styles.label}>Personal Notes</Text>
            <TextInput style={[styles.input, styles.multiline]} value={personalNotes} onChangeText={setPersonalNotes} multiline numberOfLines={6} placeholder="Add your personal notes, modifications, or reviews here..." />
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
  
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf4eb' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#00205B', textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#00205B', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#00205B', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff', color: '#00205B' },
  multiline: { minHeight: 80 },
  image: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#00205B' },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nutritionLabel: { width: 90, fontSize: 14, color: '#00205B' },
  nutritionInput: { flex: 1, borderWidth: 1, borderColor: '#00205B', borderRadius: 8, padding: 8, backgroundColor: '#fff', color: '#00205B' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 10 },
  tabBar: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00205B', backgroundColor: '#faf4eb' },
  tabText: { fontSize: 16, color: '#888', fontWeight: '600' },
  activeTabText: { color: '#00205B', fontWeight: 'bold' },
});
