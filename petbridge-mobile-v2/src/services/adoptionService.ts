import axiosInstance from '../lib/axios';

export const adoptionService = {

  createRequest: async (animalId: string, message?: string): Promise<any> => {
    const response = await axiosInstance.post('/adoptions', { animalId, message });
    return response.data;
  },

  getMyRequests: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/adoptions/my-requests');
    return response.data;
  },

  getReceivedRequests: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/adoptions/received');
    return response.data;
  },

  cancelRequest: async (id: string): Promise<any> => {
    const response = await axiosInstance.patch(`/adoptions/${id}/cancel`);
    return response.data;
  },

  acceptRequest: async (id: string): Promise<any> => {
    const response = await axiosInstance.patch(`/adoptions/${id}/accept`);
    return response.data;
  },

  rejectRequest: async (id: string, decisionNote?: string): Promise<any> => {
    const response = await axiosInstance.patch(`/adoptions/${id}/reject`, { decisionNote });
    return response.data;
  },

  sendPreAcceptanceMessage: async (adoptionId: string, content: string): Promise<any> => {
    const response = await axiosInstance.post(
      `/adoptions/${adoptionId}/message`,
      { content }
    );
    return response.data;
  },
};