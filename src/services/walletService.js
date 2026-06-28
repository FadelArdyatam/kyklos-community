import axiosClient from '../api/axiosClient';

const walletService = {
  getBalance: async () => {
    const response = await axiosClient.get('/wallet/balance');
    return response.data;
  },
  getTopups: async () => {
    const response = await axiosClient.get('/wallet/topups');
    return response.data;
  },
  getWithdrawals: async () => {
    const response = await axiosClient.get('/wallet/withdrawals');
    return response.data;
  },
  topup: async (payload) => {
    const response = await axiosClient.post('/wallet/topup', payload);
    return response.data;
  },
  withdraw: async (payload) => {
    const response = await axiosClient.post('/wallet/withdraw', payload);
    return response.data;
  },
};

export default walletService;
