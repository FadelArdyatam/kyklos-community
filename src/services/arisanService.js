import axiosClient from '../api/axiosClient';

const arisanService = {
  getParticipants: async (pocketId) => {
    const response = await axiosClient.get(`/pockets/${pocketId}/arisan/participants`);
    return response.data;
  },
  getPeriods: async (pocketId) => {
    const response = await axiosClient.get(`/pockets/${pocketId}/arisan/periods`);
    return response.data;
  },
  draw: async (pocketId) => {
    const response = await axiosClient.post(`/pockets/${pocketId}/arisan/draw`, {});
    return response.data;
  },
  addParticipant: async (pocketId, memberId) => {
    const response = await axiosClient.post(`/pockets/${pocketId}/arisan/participants`, { memberId });
    return response.data;
  },
};

export default arisanService;
