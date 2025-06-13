import { ApiWrapper, CustomAxiosConfigEnum } from '@/utils/request';

const baseUrl = '/inter-api/supos';

const api = new ApiWrapper(baseUrl);

// 新建流程
export const addFlow = async (data: any) => api.post('/flow', data);
// 复制流程
export const copyFlow = async (data: any) => api.post('/flow/copy', data);

// 修改流程
export const editFlow = async (data: any) => api.put('/flow', data);

// 删除流程
export const deleteFlow = async (id: string) => api.delete(`/flow`, { params: { id } });

// 发布流程
export const deployFlow = async (data: any) => api.post('/flow/deploy', data);

// 保存流程
export const saveFlow = async (data: any) => api.put('/flow/save', data);
// 拓扑图跳转
export const goFlow = async (alias?: string) => api.get(`/flow/uns/alias?alias=${alias}`);

// 查询流程列表,分页
export const flowPage = async (params?: Record<string, unknown>) =>
  api.get('/flows', {
    params,
    [CustomAxiosConfigEnum.BusinessResponse]: true,
  });
// 工作流程列表
export const processList = async () =>
  api.post(
    `/process/definition/pageList`,
    {
      pageNo: 1,
      pageSize: 99999,
    },
    {
      [CustomAxiosConfigEnum.BusinessResponse]: true,
    }
  );
