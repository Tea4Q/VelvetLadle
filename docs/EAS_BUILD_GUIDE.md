# EAS Build Configuration for VelvetLadle 🚀

This document explains the EAS (Expo Application Services) build configuration for the VelvetLadle recipe app.

## 📁 **File Structure**

```
.eas/
└── workflows/
    ├── create-development-builds.yml    # Main development build workflow
    └── platform-specific-builds.yml     # Platform-specific build workflows
eas.json                                 # EAS configuration file
```

## 🛠 **Build Profiles**

### **Development Profile**
```json
"development": {
  "developmentClient": true,     // Creates development build
  "distribution": "internal",    // Internal distribution only
  "channel": "development",      // Development update channel
  "android": {
    "buildType": "apk",         // Faster APK builds
    "gradleCommand": ":app:assembleDebug"
  },
  "ios": {
    "buildConfiguration": "Debug",
    "simulator": true           // Includes simulator build
  }
}
```

### **Preview Profile**
```json
"preview": {
  "distribution": "internal",    // Internal testing
  "channel": "preview",         // Preview update channel
  "android": {
    "buildType": "apk"         // APK for easy sharing
  },
  "ios": {
    "simulator": false         // Device-only builds
  }
}
```

### **Production Profile**
```json
"production": {
  "channel": "production",      // Production update channel
  "env": {
    "NODE_ENV": "production"   // Production environment
  }
}
```

## 🔄 **Workflow Configurations**

### **Main Development Workflow** (`create-development-builds.yml`)

#### **Features:**
- ✅ **Checkout**: Gets latest code from repository
- ✅ **Expo Setup**: Installs latest Expo CLI
- ✅ **Node.js Setup**: Uses Node.js 18.x for stability
- ✅ **Dependency Caching**: Caches `node_modules` and npm cache
- ✅ **TypeScript Check**: Validates TypeScript compilation
- ✅ **Linting**: Runs ESLint if configured
- ✅ **Testing**: Runs tests in CI mode
- ✅ **Build**: Creates development build for all platforms

#### **Usage:**
```bash
# Trigger this workflow
eas build --profile development --platform all
```

### **Platform-Specific Workflows** (`platform-specific-builds.yml`)

#### **Android Build** (`build_android`)
- **Optimized for**: Android development and testing
- **Cache Strategy**: Includes Gradle caches for faster builds
- **Build Type**: APK for easy installation and sharing
- **Use Case**: Android-specific testing and development

#### **iOS Build** (`build_ios`)
- **Optimized for**: iOS development and testing
- **Cache Strategy**: Includes CocoaPods caches
- **Build Type**: Development build with simulator support
- **Use Case**: iOS-specific testing and development

#### **Preview Build** (`preview_build`)
- **Optimized for**: Cross-platform testing
- **Testing**: Includes comprehensive test suite
- **Use Case**: Stakeholder reviews and QA testing

#### **Usage:**
```bash
# Android only
eas build --profile development --platform android

# iOS only  
eas build --profile development --platform ios

# Preview build
eas build --profile preview --platform all
```

## 🚀 **Build Commands**

### **Development Builds**
```bash
# All platforms (recommended for testing)
eas build --profile development --platform all

# Android only (faster for Android testing)
eas build --profile development --platform android

# iOS only (faster for iOS testing)
eas build --profile development --platform ios
```

### **Preview Builds**
```bash
# Create preview build for stakeholders
eas build --profile preview --platform all

# Preview for specific platform
eas build --profile preview --platform android
```

### **Production Builds**
```bash
# Production build for app stores
eas build --profile production --platform all

# Submit to stores
eas submit --platform all
```

## 📱 **Development Client Setup**

### **Install Development Client**
```bash
# Install Expo Dev Client
npx expo install expo-dev-client

# Build development client
eas build --profile development --platform all
```

### **Running on Development Client**
```bash
# Start development server
npx expo start --dev-client

# Or with specific options
npx expo start --dev-client --clear
```

## 🔧 **Environment Configuration**

### **Environment Variables**
Add environment variables in `eas.json`:
```json
"env": {
  "NODE_ENV": "development",
  "EXPO_PUBLIC_API_URL": "https://api.dev.velvetladle.com",
  "EXPO_PUBLIC_SUPABASE_URL": "your-supabase-url",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-supabase-key"
}
```

### **Secrets Management**
Store sensitive values as EAS secrets:
```bash
# Set secrets
eas secret:create --scope project --name SUPABASE_SERVICE_KEY --value "your-secret-key"
eas secret:create --scope project --name API_SECRET --value "your-api-secret"

# Use in eas.json
"env": {
  "SUPABASE_SERVICE_KEY": "$SUPABASE_SERVICE_KEY",
  "API_SECRET": "$API_SECRET"
}
```

## 📊 **Build Optimization**

### **Caching Strategy**
- **Node Modules**: Cached across builds for faster installs
- **npm Cache**: Speeds up dependency resolution
- **Platform Caches**: 
  - **Android**: Gradle caches
  - **iOS**: CocoaPods caches

### **Build Performance Tips**
1. **Use APK for Development**: Faster than AAB builds
2. **Enable Simulator Builds**: For iOS testing without devices
3. **Cache Dependencies**: Configured in workflows
4. **Parallel Builds**: Use platform-specific workflows when needed

## 🧪 **Testing Integration**

### **Pre-Build Checks**
1. **TypeScript Compilation**: `npx tsc --noEmit`
2. **Linting**: `npm run lint` (if configured)
3. **Unit Tests**: `npm test -- --watchAll=false --passWithNoTests`

### **Test Configuration**
Add test scripts to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --watchAll=false --passWithNoTests",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear caches and retry
eas build --profile development --platform all --clear-cache

# Check build logs
eas build:list
eas build:view [BUILD_ID]
```

#### **Dependency Issues**
```bash
# Clear local caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo install --fix
```

#### **Platform-Specific Issues**
```bash
# Android: Gradle issues
cd android && ./gradlew clean
cd .. && eas build --profile development --platform android

# iOS: CocoaPods issues
cd ios && pod deintegrate && pod install
cd .. && eas build --profile development --platform ios
```

### **Debug Information**
```bash
# Check EAS CLI version
eas --version

# Check project configuration
eas config

# View build status
eas build:list --status=in-progress
```

## 📱 **Distribution & Testing**

### **Internal Distribution**
- **Development builds** are automatically distributed internally
- **Preview builds** can be shared with stakeholders
- **QR codes** provided for easy device installation

### **Testing Workflow**
1. **Create development build**: `eas build --profile development`
2. **Install on devices**: Scan QR code or download from EAS dashboard
3. **Test features**: Use development client for live updates
4. **Create preview**: `eas build --profile preview` for stakeholder testing
5. **Production build**: `eas build --profile production` when ready

## 🚀 **Best Practices**

### **Development Workflow**
1. **Use development profile** for daily development
2. **Test on real devices** with development client
3. **Create preview builds** for stakeholder reviews
4. **Use production profile** only for store submissions

### **Performance Optimization**
1. **Cache dependencies** for faster builds
2. **Use platform-specific builds** when developing for single platform
3. **Clear caches** if experiencing issues
4. **Monitor build times** and optimize as needed

### **Security**
1. **Use EAS secrets** for sensitive values
2. **Never commit secrets** to version control
3. **Rotate secrets** regularly
4. **Use different secrets** for different environments

Your EAS build system is now configured for efficient development, testing, and production workflows! 🎉
