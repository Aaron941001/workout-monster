import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your local IP if running on device, or localhost for simulator
// For Android Emulator use 10.0.2.2
const API_URL = 'http://192.168.0.108:8000'; // Local backend for development - change to Render URL for production

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error retrieving token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
