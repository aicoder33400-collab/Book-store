const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'env'];

// 🔥 Forcer Metro à utiliser la version CommonJS de zustand
// (évite import.meta dans le bundle web)
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;
