# User Authentication & Recipe Isolation Setup Guide

## Overview
This guide walks through setting up proper Supabase authentication and ensuring each user only sees their own recipes.

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the migration file: `database_migration_add_user_id.sql`

This adds:
- `user_id` column to recipes table
- `user_id` column to favorites table  
- Row Level Security (RLS) policies to filter by user
- Proper indexes for performance

## Step 2: Update Supabase Configuration

### Enable Email Authentication
1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates (optional)

### Configure Email Confirmation (Optional)
- **Disable confirmation** for testing: Settings → Authentication → Email Auth → Uncheck "Enable email confirmations"
- **Enable confirmation** for production: Users will need to verify email before access

### Verify Password Reset Email Template
1. Go to **Authentication** → **Email Templates** in Supabase dashboard
2. Locate the **Reset Password** template
3. Verify the template contains the reset link: `{{ .ConfirmationURL }}`
4. Customize the email subject, body, and styling if desired (optional)
5. The default template works out-of-the-box for password resets

**Note**: Supabase automatically provides SMTP service for password reset emails. No custom SMTP configuration is required.

## Step 3: Password Reset Feature

### How It Works
VelvetLadle now includes a complete password reset flow:

1. **User initiates reset**: Clicks "Forgot Password?" on sign-in screen
2. **Email sent**: User enters email, Supabase sends reset link
3. **Link clicked**: User clicks link in email, app opens to reset password screen
4. **Password updated**: User enters new password, account is updated

### User Flow
```
Sign In Screen
    ↓ (click "Forgot Password?")
Forgot Password Screen (enter email)
    ↓ (email sent)
Check Email Inbox
    ↓ (click reset link)
Reset Password Screen (enter new password)
    ↓ (password updated)
Sign In Screen (with new password)
```

### Testing Password Reset

#### Prerequisites
- Supabase Email provider is enabled (Step 2)
- Valid email address for testing (must be real to receive emails)

#### Test Steps
1. **Open VelvetLadle** with Supabase configured
2. **Navigate to Sign In** screen
3. **Click "Forgot Password?"** link below password field
4. **Enter your email address** and click "Send Reset Link"
5. **Check email inbox** for message from Supabase
   - Subject: "Reset Your Password" (or customized subject)
   - Sender: `noreply@mail.app.supabase.io` (or custom domain)
6. **Click reset link** in email
   - Should open VelvetLadle app to reset password screen
   - iOS/Android: App opens automatically
   - Web: Opens in browser
7. **Enter new password** (minimum 6 characters) twice
8. **Click "Reset Password"**
9. **Verify success** - should see confirmation and navigate to sign-in
10. **Sign in with new password** to confirm it works

### Demo Mode Behavior
When Supabase is **not** configured (demo mode):
- "Forgot Password?" link still appears on sign-in screen
- Clicking it shows an alert: "Password reset requires Supabase configuration. This feature is not available in demo mode."
- Users must set up Supabase to use password reset

### Deep Linking Configuration
VelvetLadle uses the URL scheme `velvetladle://` for password reset deep links:
- **Already configured** in `app.config.js`: `scheme: "velvetladle"`
- Reset link format: `velvetladle://reset-password`
- No additional setup required

### Customizing Password Reset Emails (Optional)

To match VelvetLadle branding:
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Customize:
   - **Subject**: e.g., "Reset Your VelvetLadle Password"
   - **Body**: Add VelvetLadle logo, brand colors
   - **Button text**: e.g., "Reset My Password"
4. Keep `{{ .ConfirmationURL }}` variable in button href
5. Save changes

### Troubleshooting Password Reset

#### Email not received
- **Check spam folder** - Supabase emails may be filtered
- **Verify email provider is enabled** in Supabase dashboard
- **Check Supabase logs**: Dashboard → Logs → Filter by "auth"
- **Wait a few minutes** - email delivery can be delayed

#### "Failed to send reset link" error
- Supabase not configured - check environment variables
- Network error - verify internet connection
- Invalid email format - check for typos

#### Reset link doesn't open app
- **iOS/Android**: Verify app is installed
- **Custom URL scheme**: Check `app.config.js` has `scheme: "velvetladle"`
- **Fallback**: Manually open app and navigate to reset password screen

#### "Reset failed" or "Link expired"
- Reset links expire after 1 hour (Supabase default)
- Click "Request New Link" to send another email
- Check URL wasn't truncated by email client

#### Password update fails
- Check minimum 6 characters
- Verify passwords match
- Session may have expired - request new reset link

## Step 4: Code Changes Needed

### A. Update AuthService.ts

The current `signUp()` method already uses Supabase auth when configured, but we need to ensure it's being used. The key section is:

```typescript
// Use Supabase Auth for real account creation
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: email.toLowerCase(),
  password: password,
  options: {
    data: {
      name: name.trim(),
    },
  },
});
```

This is already implemented! ✅

### B. Add getCurrentUserId() Helper

Add this method to AuthService.ts:

```typescript
// Get current authenticated user's ID (from Supabase or local storage)
static async getCurrentUserId(): Promise<string | null> {
  try {
    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user.id;
    }
    
    // Fall back to local storage
    const user = await this.getCurrentUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
```

### C. Update RecipeDatabase Service

Modify all recipe operations to include `user_id`:

#### saveRecipe()
```typescript
static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return await DemoStorage.saveRecipe(recipe);
    }

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('recipes')
      .insert([{
        ...recipe,
        user_id: user.id, // ← ADD THIS
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error saving recipe:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

#### getAllRecipes()
No changes needed! RLS policies automatically filter by user_id when user is authenticated.

#### updateRecipe()
```typescript
// Add user_id check for updates
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { success: false, error: 'User not authenticated' };
}

const { data, error } = await supabase
  .from('recipes')
  .update({
    ...recipeData,
    updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .eq('user_id', user.id) // ← Ensures user owns this recipe
  .select()
  .single();
```

### D. Update FavoritesService

Add user_id to favorites operations:

```typescript
static async addRecipeToFavorites(recipe: Recipe): Promise<boolean> {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return await DemoStorage.addToFavorites(recipe);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id, // ← ADD THIS
        type: 'recipe',
        recipe_id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        description: recipe.description
      });

    // ... rest of code
  }
}
```

## Step 4: Update Welcome Screen

The welcome screen currently signs users in as guests for both "Sign In" and "Create Account". Update to route to proper screens:

```typescript
<Button
  label='Sign In'
  theme='primary'
  onPress={() => {
    // TODO: Navigate to proper sign in screen
    router.push('/sign-in'); // Create this screen
  }}
/>
<Button
  label='Create Account'
  theme='secondary'
  onPress={() => {
    router.push('/account'); // Use existing account screen
  }}
/>
```

## Step 5: Testing Checklist

### Test Authentication
- [ ] Create a new account with email/password
- [ ] Verify email confirmation (if enabled)
- [ ] Sign out and sign back in
- [ ] Try signing up with existing email (should fail)

### Test Recipe Isolation
- [ ] Create account A, add recipes
- [ ] Sign out, create account B
- [ ] Verify account B can't see account A's recipes
- [ ] Add recipes to account B
- [ ] Sign back into account A, verify recipes still there

### Test Guest Mode
- [ ] Continue as guest (should not be able to access Add/Recipes tabs)
- [ ] Verify guest is prompted to create account

## Step 6: Migration for Existing Data (If Applicable)

If you have existing recipes without user_id:

```sql
-- Option 1: Delete test recipes
DELETE FROM recipes WHERE user_id IS NULL;

-- Option 2: Assign to a specific user
UPDATE recipes 
SET user_id = 'your-uuid-here' 
WHERE user_id IS NULL;
```

## Expected Behavior After Setup

✅ **Sign Up**: Creates real Supabase auth account
✅ **Sign In**: Authenticates against Supabase
✅ **Recipes**: Each user sees only their own recipes  
✅ **Favorites**: Isolated per user
✅ **Guest Mode**: Can browse but cannot add recipes
✅ **RLS**: Automatic filtering at database level

## Troubleshooting

### "User not authenticated" error
- Check if Supabase session is active: `supabase.auth.getUser()`
- Verify JWT token in browser/app storage
- Check if email confirmation is required but not completed

### "Row Level Security policy violation"
- Ensure user_id is being set on insert
- Verify RLS policies are created correctly
- Check that auth.uid() matches user_id

### Users can see each other's recipes
- RLS may not be enabled: `ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;`
- Policies may be missing or incorrect
- Check for permissive "Allow all" policies

## Next Steps

1. Run the database migration SQL
2. Update AuthService with getCurrentUserId()
3. Update RecipeDatabase methods to include user_id
4. Update FavoritesService methods
5. Test with multiple user accounts
6. Deploy and monitor

