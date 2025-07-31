// Utility functions for parsing and managing recipe ingredients

export interface ParsedIngredient {
  amount: string;
  unit: string;
  name: string;
  original: string; // Keep the original string as backup
}

/**
 * Parses an ingredient string into amount, unit, and name components
 * Examples:
 * "2 cups flour" -> { amount: "2", unit: "cups", name: "flour" }
 * "1/4 teaspoon salt" -> { amount: "1/4", unit: "teaspoon", name: "salt" }
 * "3 large eggs" -> { amount: "3", unit: "large", name: "eggs" }
 * "Salt to taste" -> { amount: "", unit: "", name: "Salt to taste" }
 */
export function parseIngredient(ingredientString: string): ParsedIngredient {
  const original = ingredientString.trim();
  
  // Common units (both singular and plural)
  const units = [
    // Volume
    'cup', 'cups', 'c', 'C',
    'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'T',
    'teaspoon', 'teaspoons', 'tsp', 't',
    'fluid ounce', 'fluid ounces', 'fl oz', 'fl. oz.',
    'pint', 'pints', 'pt', 'pts',
    'quart', 'quarts', 'qt', 'qts',
    'gallon', 'gallons', 'gal', 'gals',
    'liter', 'liters', 'l', 'L',
    'milliliter', 'milliliters', 'ml', 'mL',
    
    // Weight
    'pound', 'pounds', 'lb', 'lbs',
    'ounce', 'ounces', 'oz',
    'gram', 'grams', 'g',
    'kilogram', 'kilograms', 'kg',
    
    // Count/Size descriptors
    'large', 'medium', 'small', 'extra large', 'extra small',
    'whole', 'half', 'quarter',
    'clove', 'cloves',
    'slice', 'slices',
    'piece', 'pieces',
    'can', 'cans',
    'package', 'packages', 'pkg',
    'bag', 'bags',
    'box', 'boxes',
    'jar', 'jars',
    'bottle', 'bottles',
    'bunch', 'bunches',
    'head', 'heads',
    'stalk', 'stalks',
    'sprig', 'sprigs',
    'leaf', 'leaves'
  ];

  // Create regex pattern for amounts (mixed numbers, fractions, decimals, whole numbers)
  const amountPattern = /^(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d*\.\d+|\d+)\s*/;
  
  // Try to match amount at the beginning
  const amountMatch = original.match(amountPattern);
  
  if (!amountMatch) {
    // No amount found, treat entire string as ingredient name
    return {
      amount: '',
      unit: '',
      name: original,
      original
    };
  }

  const amount = amountMatch[1];
  const remainder = original.substring(amountMatch[0].length);

  // Look for unit after the amount
  const unitPattern = new RegExp(`^(${units.join('|')})\\s+`, 'i');
  const unitMatch = remainder.match(unitPattern);

  if (unitMatch) {
    const unit = unitMatch[1];
    const name = remainder.substring(unitMatch[0].length);
    return {
      amount,
      unit,
      name: name.trim(),
      original
    };
  }

  // No standard unit found, treat remainder as name
  return {
    amount,
    unit: '',
    name: remainder.trim(),
    original
  };
}

/**
 * Formats a parsed ingredient back to a readable string
 */
export function formatIngredient(ingredient: ParsedIngredient): string {
  const parts = [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean);
  return parts.join(' ');
}

/**
 * Parses an array of ingredient strings
 */
export function parseIngredients(ingredients: string[]): ParsedIngredient[] {
  return ingredients.map(parseIngredient);
}

/**
 * Scales ingredient amounts by a multiplier
 */
export function scaleIngredient(ingredient: ParsedIngredient, multiplier: number): ParsedIngredient {
  if (!ingredient.amount) {
    return ingredient; // Can't scale ingredients without amounts
  }

  // Parse fractions and decimals, including mixed numbers
  let amount: number;
  
  // Handle mixed numbers like "1 1/4"
  const mixedNumberMatch = ingredient.amount.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumberMatch) {
    const [, whole, numerator, denominator] = mixedNumberMatch;
    amount = parseInt(whole) + parseInt(numerator) / parseInt(denominator);
  } else if (ingredient.amount.includes('/')) {
    const [numerator, denominator] = ingredient.amount.split('/').map(Number);
    amount = numerator / denominator;
  } else {
    amount = parseFloat(ingredient.amount);
  }

  if (isNaN(amount)) {
    return ingredient; // Can't parse amount
  }

  const scaledAmount = amount * multiplier;
  
  // Convert back to string, handling fractions nicely
  const scaledAmountStr = convertToFraction(scaledAmount) || scaledAmount.toFixed(2).replace(/\.?0+$/, '');

  return {
    ...ingredient,
    amount: scaledAmountStr,
    original: formatIngredient({
      ...ingredient,
      amount: scaledAmountStr
    })
  };
}

/**
 * Convert decimal to common fractions with better handling of mixed numbers
 */
function convertToFraction(decimal: number): string | null {
  // Handle whole numbers
  if (decimal % 1 === 0) {
    return decimal.toString();
  }

  // Extract whole number part
  const wholePart = Math.floor(decimal);
  const fractionalPart = decimal - wholePart;

  // Common fractions with more precision
  const commonFractions: { [key: string]: string } = {
    '0.125': '1/8',
    '0.167': '1/6', 
    '0.25': '1/4',
    '0.333': '1/3',
    '0.375': '3/8',
    '0.5': '1/2',
    '0.625': '5/8',
    '0.667': '2/3',
    '0.75': '3/4',
    '0.833': '5/6',
    '0.875': '7/8'
  };

  // Find closest fraction (with tolerance)
  let closestFraction = null;
  let minDifference = Infinity;
  
  for (const [decimalStr, fractionStr] of Object.entries(commonFractions)) {
    const fractionDecimal = parseFloat(decimalStr);
    const difference = Math.abs(fractionalPart - fractionDecimal);
    if (difference < minDifference && difference < 0.02) { // 2% tolerance
      minDifference = difference;
      closestFraction = fractionStr;
    }
  }

  if (closestFraction) {
    return wholePart > 0 ? `${wholePart} ${closestFraction}` : closestFraction;
  }

  // If no common fraction found, use decimal
  return wholePart > 0 ? 
    `${wholePart} ${fractionalPart.toFixed(2)}`.replace(/\.?0+$/, '') : 
    fractionalPart.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Scale an entire recipe's ingredients
 */
export function scaleIngredients(ingredients: ParsedIngredient[], multiplier: number): ParsedIngredient[] {
  return ingredients.map(ingredient => scaleIngredient(ingredient, multiplier));
}
