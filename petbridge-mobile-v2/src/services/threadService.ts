import axiosInstance from '../lib/axios';

export const threadService = {

  getThreads: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/threads');
    return response.data;
  },

  getThreadById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/threads/${id}`);
    return response.data;
  },

  sendMessage: async (threadId: string, content: string): Promise<any> => {
    const response = await axiosInstance.post(`/threads/${threadId}/messages`, { content });
    return response.data;
  },

  markAsRead: async (threadId: string): Promise<void> => {
    await axiosInstance.patch(`/threads/${threadId}/messages/read`);
  },
};