const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Hermes
config.transformer.hermesCommand = require.resolve('hermes-engine/osx-bin/hermesc');

// Add more file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite
  'db'
);

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

module.exports = config;