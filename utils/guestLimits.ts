import { Alert } from 'react-native';
import AuthService from '../services/AuthService';
import { RecipeDatabase } from '../services/recipeDatabase';
import { GUEST_RECIPE_LIMIT } from '../constants/limits';

/**
 * Checks if the current guest user has reached their recipe limit.
 * Shows an alert if limit is reached.
 * 
 * @returns true if user can proceed (not a guest or under limit), false if limit reached
 */
export async function checkGuestRecipeLimit(): Promise<boolean> {
  try {
    const isGuest = await AuthService.isCurrentUserGuest();
    
    if (!isGuest) {
      return true; // Not a guest, no limits
    }
    
    const allRecipes = await RecipeDatabase.getAllRecipes();
    
    if (allRecipes.length >= GUEST_RECIPE_LIMIT) {
      Alert.alert(
        'Guest Limit Reached',
        `Guest users can save up to ${GUEST_RECIPE_LIMIT} recipes. Create a free account to save unlimited recipes and sync across devices!`,
        [
          { text: 'OK' },
          { 
            text: 'Create Account', 
            onPress: () => {
              Alert.alert('Coming Soon', 'Account creation will be available in the next update!');
            }
          }
        ]
      );
      return false; // Limit reached
    }
    
    return true; // Under limit
  } catch (error) {
    console.error('Error checking guest recipe limit:', error);
    return true; // Allow operation on error to avoid blocking users
  }
}
