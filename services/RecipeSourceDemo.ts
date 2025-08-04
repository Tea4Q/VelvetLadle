import { RecipeSourceService } from './RecipeSourceService';

export class RecipeSourceDemo {
  // Initialize demo data for first-time users
  static async initializeDemoSources(): Promise<void> {
    const existingSources = await RecipeSourceService.getSources();
    
    // Only add demo sources if none exist
    if (existingSources.length === 0) {
      const demoSources = [
        "Grandma's recipe",
        "Mom's handwritten notes",
        "Family cookbook",
        "Found in recipe box",
        "From neighbor",
        "Old family recipe",
        "Handwritten card",
        "Recipe passed down"
      ];

      // Add demo sources with varying usage counts to simulate real usage
      for (let i = 0; i < demoSources.length; i++) {
        await RecipeSourceService.addSource(demoSources[i]);
        
        // Add some sources multiple times to create realistic usage patterns
        if (i < 3) {
          await RecipeSourceService.addSource(demoSources[i]);
        }
        if (i < 1) {
          await RecipeSourceService.addSource(demoSources[i]);
        }
      }
    }
  }
}
