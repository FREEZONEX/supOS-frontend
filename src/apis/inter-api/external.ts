import { ApiWrapper } from '@/utils/request';

const baseUrl = '/inter-api/supos/external';

const api = new ApiWrapper(baseUrl);

export const getExternalTreeData = async (params?: Record<string, unknown>) => api.get('/tree', { params });
export const parserTopicPayload = async (params?: Record<string, unknown>) =>
  api.get('/parserTopicPayload', { params });
export const topic2Uns = async (data: any) => api.post('/topic2Uns', data);
