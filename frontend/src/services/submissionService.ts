import apiClient from './api';
import { PilotSubmission, PilotSubmissionStatus } from '../types';

export interface PilotSubmissionCreateParams {
  pilot_id: number;
  results?: string;
  kpi_results?: Record<string, any>;
  evidence?: Record<string, any>;
}

export interface PilotSubmissionUpdateParams {
  results?: string;
  kpi_results?: Record<string, any>;
  evidence?: Record<string, any>;
  status?: PilotSubmissionStatus;
}

export const submissionService = {
  createSubmission: async (data: PilotSubmissionCreateParams): Promise<PilotSubmission> => {
    const response = await apiClient.post<PilotSubmission>('/pilot-submissions', data);
    return response.data;
  },

  updateSubmission: async (id: number, data: PilotSubmissionUpdateParams): Promise<PilotSubmission> => {
    const response = await apiClient.put<PilotSubmission>(`/pilot-submissions/${id}`, data);
    return response.data;
  },

  submitSubmission: async (id: number): Promise<PilotSubmission> => {
    const response = await apiClient.post<PilotSubmission>(`/pilot-submissions/${id}/submit`);
    return response.data;
  },

  listSubmissions: async (params?: {
    pilot_id?: number;
    status?: PilotSubmissionStatus;
    skip?: number;
    limit?: number;
  }): Promise<PilotSubmission[]> => {
    const response = await apiClient.get<PilotSubmission[]>('/pilot-submissions', { params });
    return response.data;
  },

  getSubmission: async (id: number): Promise<PilotSubmission> => {
    const response = await apiClient.get<PilotSubmission>(`/pilot-submissions/${id}`);
    return response.data;
  },
};

export default submissionService;
