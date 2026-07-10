const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurar resolución de assets
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  // Lottie animations
  'json',
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg'
);

// Configurar plataformas
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configurar transformer para evitar problemas con TypeScript
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Deshabilitar el stripping de tipos para node_modules
  unstable_disableES6Transforms: false,
};

// Configurar resolver para manejar mejor las extensiones
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

module.exports = config;