const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Примусово кажемо бандлеру, що mp3 та wav — це нормальні файли
config.resolver.assetExts.push('mp3', 'wav');

module.exports = config;