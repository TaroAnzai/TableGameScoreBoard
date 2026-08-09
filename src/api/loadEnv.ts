export const API_BASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:6080'
  : process.env.EXPO_PUBLIC_API_URL || 'https://api.anzai-home.com/mahjong';
