import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecipeSource = {
  id: string;
  source: string;
  lastUsed: string;
  usageCount: number;
};

export class RecipeSourceService {
  private static STORAGE_KEY = 'recipe_sources';

  // Get all previously used recipe sources
  static async getSources(): Promise<RecipeSource[]> {
    try {
      const sourcesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!sourcesJson) return [];
      
      const sources: RecipeSource[] = JSON.parse(sourcesJson);
      
      // Remove any potential duplicates based on source text
      const uniqueSources = sources.filter((source, index, array) => 
        array.findIndex(s => s.source.toLowerCase() === source.source.toLowerCase()) === index
      );

      // Sort by usage count (descending) and then by last used (most recent first)
      return uniqueSources.sort((a, b) => {
        if (b.usageCount !== a.usageCount) {
          return b.usageCount - a.usageCount;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });
    } catch (error) {
      console.error('Error loading recipe sources:', error);
      return [];
    }
  }

  // Add or update a recipe source
  static async addSource(source: string): Promise<void> {
    if (!source || source.trim() === '') return;
    
    const trimmedSource = source.trim();
    
    try {
      const existingSources = await this.getSources();
      const existingIndex = existingSources.findIndex(s => s.source.toLowerCase() === trimmedSource.toLowerCase());
      
      if (existingIndex >= 0) {
        // Update existing source
        existingSources[existingIndex].usageCount += 1;
        existingSources[existingIndex].lastUsed = new Date().toISOString();
      } else {
        // Add new source
        const newSource: RecipeSource = {
          id: Date.now().toString(),
          source: trimmedSource,
          lastUsed: new Date().toISOString(),
          usageCount: 1
        };
        existingSources.push(newSource);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingSources));
    } catch (error) {
      console.error('Error saving recipe source:', error);
    }
  }

  // Get suggested sources based on partial input
  static async getSuggestions(partialInput: string): Promise<RecipeSource[]> {
    if (!partialInput || partialInput.trim() === '') {
      return await this.getSources();
    }
    
    const sources = await this.getSources();
    const searchTerm = partialInput.toLowerCase().trim();
    
    const filteredSources = sources.filter(source => 
      source.source.toLowerCase().includes(searchTerm)
    );

    // Remove any potential duplicates based on source text
    const uniqueSources = filteredSources.filter((source, index, array) => 
      array.findIndex(s => s.source.toLowerCase() === source.source.toLowerCase()) === index
    );

    return uniqueSources;
  }

  // Clear all sources (for testing or reset purposes)
  static async clearSources(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recipe sources:', error);
    }
  }
}
