// Dynamic Expo config to inject Google Maps keys without committing credentials.
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    scheme: config.scheme || 'qponsvip',
    extra: {
      ...(config.extra || {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    },
    plugins: [
      ...(config.plugins || []),
      ...((config.plugins || []).includes('expo-router') ? [] : ['expo-router']),
      ...((config.plugins || []).includes('expo-secure-store') ? [] : ['expo-secure-store']),
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
  };
};
