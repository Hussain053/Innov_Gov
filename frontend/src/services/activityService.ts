import apiClient from './api';
import { ActivityLog } from '../types';

export const activityService = {
  listActivity: async (params?: {
    resource_type?: string;
    resource_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>('/activity', { params });
    return response.data;
  },
};

export default activityService;
