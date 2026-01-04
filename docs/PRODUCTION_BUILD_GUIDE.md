# Production Build Guide for VelvetLadle 🚀📱

This guide covers production builds and app store deployment for the VelvetLadle recipe app.

## 📁 **Production Workflow Files**

```
.eas/
└── workflows/
    ├── create-production-builds.yml     # Standard production builds
    └── production-deployment.yml        # Advanced deployment workflows
eas.json                                 # EAS configuration with production profile
```

## 🏗 **Production Build Profiles**

### **Production Profile Configuration**
```json
"production": {
  "channel": "production",           // Production update channel
  "env": {
    "NODE_ENV": "production"        // Production environment
  },
  "android": {
    "buildType": "app-bundle"       // AAB for Play Store
  },
  "ios": {
    "buildConfiguration": "Release" // Release configuration
  }
}
```

## 🚀 **Production Workflows**

### **1. Standard Production Builds** (`create-production-builds.yml`)

#### **Android Production Build**
```yaml
build_production_android:
  - Checkout code
  - Setup Expo & Node.js
  - Cache dependencies (including Gradle)
  - Install dependencies
  - TypeScript validation
  - Linting checks
  - Run tests with coverage
  - Build Android AAB for Play Store
```

#### **iOS Production Build**
```yaml
build_production_ios:
  - Checkout code
  - Setup Expo & Node.js
  - Cache dependencies (including CocoaPods)
  - Install dependencies
  - TypeScript validation
  - Linting checks
  - Run tests with coverage
  - Build iOS for App Store
```

#### **All Platforms Build**
```yaml
build_production_all:
  - Complete validation suite
  - App configuration validation
  - Build both platforms
  - Ready for store submission
```

### **2. Advanced Deployment** (`production-deployment.yml`)

#### **Build and Submit Workflow**
```yaml
build_and_submit_production:
  - Full testing and validation
  - Security vulnerability check
  - Build for all platforms
  - Automatic submission to stores
```

#### **Release Candidate Workflow**
```yaml
release_candidate_build:
  - Strict TypeScript checking
  - High test coverage requirements (80%+)
  - Performance validation
  - Security auditing
  - Production-ready build
```

## 📋 **Pre-Production Checklist**

### **🔍 Code Quality**
- [ ] **TypeScript**: No compilation errors
- [ ] **ESLint**: No linting errors or warnings
- [ ] **Tests**: All tests passing with 80%+ coverage
- [ ] **Security**: No high/moderate vulnerabilities
- [ ] **Performance**: Bundle size within limits

### **📱 App Configuration**
- [ ] **App Icon**: High-quality icons for all sizes
- [ ] **Splash Screen**: Proper splash screen assets
- [ ] **App Name**: Finalized app name and description
- [ ] **Version**: Incremented version numbers
- [ ] **Permissions**: Only necessary permissions requested

### **🔐 Credentials & Certificates**
- [ ] **Android**: Google Play Service Account JSON
- [ ] **iOS**: Apple Developer certificates
- [ ] **Signing**: Proper code signing configuration
- [ ] **Provisioning**: Valid provisioning profiles

### **🌐 Backend & Services**
- [ ] **Production APIs**: All APIs pointing to production
- [ ] **Database**: Production database configured
- [ ] **Analytics**: Production analytics setup
- [ ] **Error Tracking**: Production error reporting

## 🛠 **Build Commands**

### **Local Production Builds**
```bash
# Build for all platforms
eas build --profile production --platform all

# Platform-specific builds
eas build --profile production --platform android
eas build --profile production --platform ios

# Release candidate build
eas build --profile production --platform all --message "Release candidate v1.0.0"
```

### **Build with Submission**
```bash
# Build and submit to stores
eas build --profile production --platform all --auto-submit

# Submit existing build
eas submit --profile production --platform all
```

### **Build Status & Management**
```bash
# Check build status
eas build:list --status=in-progress --limit=10

# View specific build
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel [BUILD_ID]
```

## 📦 **App Store Configuration**

### **Google Play Store Setup**
```json
"android": {
  "serviceAccountKeyPath": "./android-service-account.json",
  "track": "internal",        // internal → alpha → beta → production
  "releaseStatus": "draft"    // draft → inProgress → halted → completed
}
```

#### **Google Play Tracks**
- **Internal**: Team testing (up to 100 testers)
- **Alpha**: Closed testing (limited audience)
- **Beta**: Open testing (public, but limited)
- **Production**: Live in Play Store

### **Apple App Store Setup**
```json
"ios": {
  "appleId": "your-apple-id@example.com",
  "ascAppId": "1234567890",      // App Store Connect App ID
  "appleTeamId": "ABCDEFGHIJ"    // Apple Developer Team ID
}
```

#### **iOS Submission Process**
1. **Build**: Create production iOS build
2. **Upload**: Automatically uploaded to App Store Connect
3. **Review**: Submit for App Store review
4. **Release**: Release to App Store after approval

## 🔐 **Security & Credentials**

### **Required Credentials**

#### **Android (Google Play)**
```bash
# Create service account in Google Cloud Console
# Download JSON key file
# Store securely (DO NOT commit to git)

# Set as EAS secret
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY --value "$(cat android-service-account.json)"
```

#### **iOS (Apple App Store)**
```bash
# Apple Developer Account required
# App Store Connect access
# Valid certificates and provisioning profiles

# Set Apple ID as secret
eas secret:create --scope project --name APPLE_ID --value "your-apple-id@example.com"
eas secret:create --scope project --name APPLE_PASSWORD --value "app-specific-password"
```

### **Environment Variables**
```json
"env": {
  "NODE_ENV": "production",
  "EXPO_PUBLIC_API_URL": "https://api.velvetladle.com",
  "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_PRODUCTION_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_PRODUCTION_ANON_KEY"
}
```

## 📊 **Build Optimization**

### **Bundle Size Optimization**
```bash
# Analyze bundle size
npx expo export --platform all --output-dir dist
du -sh dist/

# Check specific platform bundles
du -sh dist/_expo/static/js/web/
du -sh dist/_expo/static/js/ios/
du -sh dist/_expo/static/js/android/
```

### **Performance Validation**
```bash
# Run performance checks
npm run build --if-present
npm run analyze --if-present

# Check startup time
npx expo export --platform all --dev=false
```

### **Asset Optimization**
```bash
# Optimize images
npx expo optimize

# Validate icons and splash screens
npx expo export:embed --platform all
```

## 🧪 **Testing Production Builds**

### **Internal Testing**
```bash
# Create internal test build
eas build --profile production --platform all

# Distribute to internal testers
# Use QR codes or direct download links
```

### **Beta Testing**
```bash
# Submit to beta testing tracks
eas submit --profile production --platform android --track beta
eas submit --profile production --platform ios --track testflight
```

### **Testing Checklist**
- [ ] **Installation**: App installs without issues
- [ ] **Startup**: Fast startup and splash screen
- [ ] **Core Features**: All main features working
- [ ] **Performance**: Smooth UI and responsive interactions
- [ ] **Offline**: Works without internet connection
- [ ] **Edge Cases**: Handle errors gracefully
- [ ] **Different Devices**: Test on various screen sizes

## 🚀 **Release Process**

### **Version Management**
```bash
# Update version in app.json/app.config.js
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    },
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

### **Release Steps**
1. **Code Freeze**: Finalize all features
2. **Testing**: Complete testing checklist
3. **Build**: Create production builds
4. **Internal Testing**: Test production builds internally
5. **Beta Release**: Release to beta testers
6. **Store Submission**: Submit to app stores
7. **Marketing**: Prepare store listings and marketing materials
8. **Launch**: Release to production

### **Post-Release Monitoring**
```bash
# Monitor build status
eas build:list --limit=5

# Check submission status
eas submit:list --limit=5

# Monitor crash reports and user feedback
```

## 📱 **Store Listing Optimization**

### **App Store Metadata**
- **App Name**: "VelvetLadle - Recipe Manager"
- **Description**: Compelling description highlighting key features
- **Keywords**: Relevant keywords for discovery
- **Screenshots**: High-quality screenshots showing main features
- **App Icon**: Professional, recognizable icon

### **Google Play Store**
- **Short Description**: Concise value proposition
- **Full Description**: Detailed feature list with benefits
- **Graphics**: Feature graphics, screenshots, videos
- **Content Rating**: Appropriate content rating

## 🔧 **Troubleshooting Production Builds**

### **Common Issues**

#### **Build Failures**
```bash
# Clear all caches
eas build --profile production --platform all --clear-cache

# Check build logs
eas build:view [BUILD_ID]

# Retry with verbose logging
eas build --profile production --platform all --verbose
```

#### **Submission Failures**
```bash
# Check submission status
eas submit:list

# Retry submission
eas submit --profile production --platform [android|ios] --verbose

# Manual submission
# Download .aab/.ipa and upload manually to stores
```

#### **Certificate Issues**
```bash
# iOS: Regenerate certificates
eas credentials

# Android: Check service account permissions
# Ensure Google Play Console access
```

### **Debug Information**
```bash
# Check EAS project configuration
eas config

# Validate credentials
eas credentials:list

# Check project status
eas project:info
```

## ✅ **Production Readiness Checklist**

### **Technical Requirements**
- [x] **Build Configuration**: Production profile properly configured
- [x] **Testing**: Comprehensive test suite with coverage
- [x] **Performance**: Optimized bundle size and performance
- [x] **Security**: No vulnerabilities, secure credential management
- [x] **Error Handling**: Proper error boundaries and crash reporting

### **Business Requirements**
- [ ] **Legal**: Privacy policy, terms of service
- [ ] **Compliance**: GDPR, platform guidelines compliance
- [ ] **Marketing**: Store listings, marketing materials
- [ ] **Support**: Customer support processes
- [ ] **Analytics**: Usage tracking and analytics setup

### **Deployment Requirements**
- [ ] **Credentials**: All certificates and keys configured
- [ ] **Environments**: Production APIs and services ready
- [ ] **Monitoring**: Error tracking and performance monitoring
- [ ] **Rollback Plan**: Plan for handling issues post-release
- [ ] **Documentation**: User guides and support documentation

Your production build system is now ready for professional app store deployment! 🎉📱
