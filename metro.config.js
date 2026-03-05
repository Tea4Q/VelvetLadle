const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Ensure public folder is included in Metro's asset processing for web
config.projectRoot = __dirname;

module.exports = config;
