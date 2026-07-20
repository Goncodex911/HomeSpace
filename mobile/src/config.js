import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const HTTP_PORT = 5001;

// Tự động tìm IP máy tính của bạn khi chạy Expo để luôn kết nối được
const getDynamicHostIp = () => {
  try {
    const url = Linking.createURL('');
    // exp://192.168.1.13:8081 -> 192.168.1.13
    const parsed = url.replace('exp://', '').split(':')[0];
    if (parsed && parsed !== 'localhost' && parsed !== '127.0.0.1') {
      return parsed;
    }
  } catch (err) {
    console.warn('[CONFIG] Failed to parse dynamic host IP:', err.message);
  }
  return '192.168.1.13'; // IP dự phòng mặc định
};

const LAN_IP = getDynamicHostIp();

export const API_BASE_URL_OVERRIDE = null;

export const API_BASE_URL = Platform.select({
  web: `http://localhost:${HTTP_PORT}/api`,
  default: `http://${LAN_IP}:${HTTP_PORT}/api`,
});

export const getApiBaseUrl = () => API_BASE_URL_OVERRIDE || API_BASE_URL;

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '64466099943-5qh51muuhim7edlvdu4e3ghgnq0smif0.apps.googleusercontent.com';
