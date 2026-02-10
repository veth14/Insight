const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    // Force axios to use the browser/react-native build
    return context.resolveRequest(context, 'axios/dist/browser/axios.cjs', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;