# Google Play Release Guide for VelvetLadle

## Pre-Release Status ✅

### Completed Tasks

- ✅ Console logs cleaned up (`npm run prebuild` will remove remaining ones)
- ✅ Version bumped to 1.0.1
- ✅ CHANGELOG updated with v1.0.1 release notes
- ✅ Authentication system fixed and tested
- ✅ Database schema cleaned up (removed redundant columns)
- ✅ RLS policies configured for guest and authenticated users

### Required Before Build

1. **Create Service Account for Google Play**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new service account or use existing
   - Grant permissions: "Service Account User" and "Owner" roles
   - Generate JSON key and save as `android-service-account.json` in project root
   - **DO NOT** commit this file to git (already in .gitignore)

2. **Update eas.json (if needed)**
   - Current track: `internal` (for testing)
   - Release status: `draft` (requires manual approval)
   - Change track to `production` when ready for public release

3. **Test Accounts in Database**
   - Guest: velvetladle.guest@gmail.com / guest123
   - Free: velvetladle.free@gmail.com / free123
   - Paid: velvetladle.paid@gmail.com / paid123
   - Run SQL to confirm emails: See CHANGELOG v1.0.1

## Build Commands

### 1. Production Build (AAB for Play Store)

```bash
npm run build:production
```

This creates an Android App Bundle (.aab) optimized for Google Play.

### 2. Submit to Google Play (requires service account JSON)

```bash
npx eas submit -p android --latest
```

Or manually:

```bash
npx eas submit -p android \
  --service-account-key-path=./android-service-account.json \
  --track=internal
```

## Google Play Console Setup

### First-Time Setup

1. **Create App in Google Play Console**
   - App name: Velvet Ladle
   - Package name: com.yourcompany.velvetladle (check app.json)
   - Category: Food & Drink

2. **Store Listing**
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Screenshots (required):
     - Phone: 2-8 screenshots, 16:9 or 9:16 aspect ratio
     - Tablet: 1-8 screenshots (optional but recommended)
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG

3. **Content Rating**
   - Fill out questionnaire
   - App contains NO:
     - Violence
     - Sexual content
     - Drugs/alcohol
     - Gambling
   - Should get "Everyone" rating

4. **Privacy Policy**
   - Required if app collects user data
   - URL to hosted policy (can be GitHub Pages)

5. **App Access**
   - Provide test credentials if needed:
     - Email: velvetladle.free@gmail.com
     - Password: free123

### Release Tracks

- **Internal**: For team testing (up to 100 testers)
- **Closed**: For selected testers (opt-in via link)
- **Open**: Public beta testing
- **Production**: Live to all users

## Testing Checklist Before Production

### Core Features

- [x] Sign up with new account
- [x] Sign in with existing account
- [x] Add recipe from URL (try 3 different sites)
- [x] Add recipe manually
- [x] View recipe details
- [x] Edit existing recipe
- [x] Delete recipe
- [x] Mark recipe as favorite
- [x] Un-favorite recipe
- [x] Search recipes by title
- [x] Filter by ingredients
- [x] Filter by cuisine
- [x] Sign out
- [x] Guest mode (no sign-in) - view demo recipes only

### Database/Cloud Features

- [x] Recipes save to Supabase
- [x] Sign out and sign back in - recipes persist
- [x] Guests see demo recipes (user_id = NULL)
- [x] Authenticated users see only their recipes
- [x] Recipe count limits enforced (10 for free)

### Edge Cases

- [x] No internet connection - appropriate error messages
- [x] Invalid URL for recipe extraction
- [x] Recipe with no image
- [x] Very long recipe title/ingredients
- [x] Special characters in recipe data

## Environment Variables

Ensure `.env.local` has:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-long-key
EXPO_PUBLIC_SPOONACULAR_KEY=your-api-key
EXPO_PUBLIC_SCRAPINGBEE_KEY=your-api-key
```

**Note**: Environment variables are bundled into the app at build time. Update and rebuild if changed.

## Common Issues

### Build Fails

- Check `eas-build-*.log` for errors
- Verify all dependencies are compatible
- Try `npm install` fresh
- Clear EAS cache: `eas build --clear-cache`

### Submit Fails

- Verify service account JSON is valid
- Check Google Play Console for error messages
- Ensure app is created in Google Play Console first
- Verify package name matches in app.json and Play Console

### App Rejected

- Missing privacy policy
- Insufficient screenshots
- Content rating not completed
- Missing store listing information

## Post-Release

1. **Monitor Crash Reports** in Google Play Console
2. **Respond to Reviews** within 48 hours
3. **Update Regularly** - Google favors actively maintained apps
4. **Track Metrics**:
   - Install/uninstall rate
   - User retention
   - Crash-free users percentage

## Next Steps After This Release

1. Get your Google service account JSON credentials
2. Add file to project root as `android-service-account.json`
3. Run `npm run build:production`
4. Submit to internal track for testing
5. Test thoroughly with real devices
6. Promote to production when ready

---

**Current Version**: 1.0.1  
**Build Type**: Android App Bundle (.aab)  
**Target**: Google Play Store Internal Testing → Production
