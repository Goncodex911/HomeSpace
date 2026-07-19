import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getItem(key) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    return AsyncStorage.removeItem(key);
  },
};
