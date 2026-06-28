import axiosClient from '../api/axiosClient';

export const authService = {
  register: async (data) => {
    // data = { email, password, name }
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },
  
  verifyOtp: async (data) => {
    // data = { email, otp }
    const response = await axiosClient.post('/auth/verify-otp', data);
    return response.data;
  },

  login: async (data) => {
    // data = { email, password }
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    // data = { name, avatarUrl }
    const response = await axiosClient.patch('/auth/profile', data);
    return response.data;
  },
};
