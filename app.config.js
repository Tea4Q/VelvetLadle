const path = require("path");

// Set Expo Router environment variables early
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, "app");
process.env.EXPO_ROUTER_PROJECT_ROOT = __dirname;
process.env.EXPO_PROJECT_ROOT = __dirname;

module.exports = ({ config }) => {
  return {
    ...config,
    name: "Velvet Ladle",
    slug: "VelvetLadle",
    version: "2.1.0",
    orientation: "portrait",
    icon: "./assets/images/favicon_velvetLadle_large_128x128.png",
    scheme: "velvetladle",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // VelvetLadle's platform-specific configuration
    ios: {
      ...(config.ios ?? {}),
      config: {
        ...((config.ios && config.ios.config) ?? {}),
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        ...((config.ios && config.ios.infoPlist) ?? {}),
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: "com.tea4q.velvetladle",
    },
    android: {
      package: "com.qtea.VelvetLadle",
      adaptiveIcon: {
        foregroundImage: "./assets/images/social_icon_velvetLadle_400x400.png",
        backgroundColor: "#ffffff",
      },
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon_velvetLadle_small_48x48.png",
    },

    plugins: [
      ["expo-router"],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow VelvetLadle to access your photos for recipe images",
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    updates: {
      enabled: true,
      checkOnLaunch: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/df5296c9-1e42-454b-924c-07dc23f4ed53",
    },

    runtimeVersion: "1.0.1",
    owner: "qtea",

    extra: {
      eas: {
        projectId: "df5296c9-1e42-454b-924c-07dc23f4ed53",
      },
    },
  };
};
