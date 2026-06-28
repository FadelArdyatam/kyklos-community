import axiosClient from '../api/axiosClient';

const pocketService = {
  getTransactions: async (pocketId, params = {}) => {
    const response = await axiosClient.get(`/pockets/${pocketId}/transactions`, { params });
    return response.data;
  },
};

export default pocketService;
