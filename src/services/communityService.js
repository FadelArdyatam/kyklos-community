import axiosClient from '../api/axiosClient';

const communityService = {
  getCommunities: async () => {
    const response = await axiosClient.get('/communities');
    return response.data;
  },
  getDashboard: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/dashboard`);
    return response.data;
  },
  getMyContributions: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/contributions/mine`);
    return response.data;
  },
  getPockets: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/pockets`);
    return response.data;
  },
  getDues: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/dues`);
    return response.data;
  },
  getPosts: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/posts`);
    return response.data;
  },
  createPost: async (communityId, data) => {
    try {
      const response = await axiosClient.post(`/communities/${communityId}/posts`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getComments: async (postId) => {
    try {
      const response = await axiosClient.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addComment: async (postId, data) => {
    try {
      const response = await axiosClient.post(`/posts/${postId}/comments`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEvents: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/events`);
    return response.data;
  },
  createEvent: async (communityId, payload) => {
    const response = await axiosClient.post(`/communities/${communityId}/events`, payload);
    return response.data;
  },
  getPaymentConfig: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/payment-config`);
    return response.data;
  },
  updatePaymentConfig: async (communityId, payload) => {
    const response = await axiosClient.post(`/communities/${communityId}/payment-config`, payload);
    return response.data;
  },
  getMembers: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/members`);
    return response.data;
  },
  addMember: async (communityId, payload) => {
    const response = await axiosClient.post(`/communities/${communityId}/members`, payload);
    return response.data;
  },
  removeMember: async (communityId, membershipId) => {
    const response = await axiosClient.delete(`/communities/${communityId}/members/${membershipId}`);
    return response.data;
  },
  getContributions: async (communityId) => {
    const response = await axiosClient.get(`/communities/${communityId}/contributions`);
    return response.data;
  },
  createDue: async (communityId, payload) => {
    const response = await axiosClient.post(`/communities/${communityId}/dues`, payload);
    return response.data;
  },
  generateDue: async (dueId) => {
    const response = await axiosClient.post(`/dues/${dueId}/generate`, {});
    return response.data;
  },
  verifyContribution: async (contributionId) => {
    const response = await axiosClient.post(`/contributions/${contributionId}/verify`, {});
    return response.data;
  }
};

export default communityService;
