import axiosInstance from '../lib/axios';

export const checkInService = {
  getMyCheckIns: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/checkins/my');
    return response.data;
  },

  getByAdoption: async (adoptionId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/checkins/adoption/${adoptionId}`);
    return response.data;
  },

  getTimeline: async (adoptionId: string): Promise<any> => {
    const response = await axiosInstance.get(`/checkins/adoption/${adoptionId}/timeline`);
    return response.data;
  },

  create: async (adoptionId: string, dto: { message?: string; scheduledFor?: string }): Promise<any> => {
    const response = await axiosInstance.post(`/checkins/adoption/${adoptionId}`, dto);
    return response.data;
  },

  respond: async (id: string, dto: { responseNote?: string; photoUrl?: string; wellbeingScore?: number }): Promise<any> => {
    const response = await axiosInstance.put(`/checkins/${id}/respond`, dto);
    return response.data;
  },
};