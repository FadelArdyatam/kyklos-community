import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Retrieve API URL from .env (in Expo, env vars must start with EXPO_PUBLIC_)
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Timeout 10 detik agar tidak hang selamanya
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject token automatically
axiosClient.interceptors.request.use(
  async (config) => {
    console.log(`[API REQUEST] => ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally (e.g., 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Token expired or unauthorized. Handling logout...');
      // TODO: Handle auto-logout or token refresh here
      // e.g., await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
