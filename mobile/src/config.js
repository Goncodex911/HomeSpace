import { Platform } from 'react-native';

/**
 * API base for Expo.
 * Server HTTP (Expo) = PORT+1 = 5001 when HTTPS certs exist.
 * Đổi LAN_IP thành IP máy bạn (ipconfig) nếu test trên điện thoại thật.
 */
const LAN_IP = '192.168.1.176';
const HTTP_PORT = 5001;

/** Đặt string để ghi đè, ví dụ: 'http://10.0.2.2:5001/api' (Android emulator) */
export const API_BASE_URL_OVERRIDE = null;

export const API_BASE_URL = Platform.select({
  web: `http://localhost:${HTTP_PORT}/api`,
  default: `http://${LAN_IP}:${HTTP_PORT}/api`,
});

export const getApiBaseUrl = () => API_BASE_URL_OVERRIDE || API_BASE_URL;

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '64466099943-5qh51muuhim7edlvdu4e3ghgnq0smif0.apps.googleusercontent.com';
