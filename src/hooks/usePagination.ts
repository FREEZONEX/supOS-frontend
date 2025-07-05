import { Key, useCallback, useEffect, useRef, useState } from 'react';
interface UsePaginationParams {
  initPageSize?: number; // 每页大小，默认为10
  initPageSizes?: number[];
  initPage?: number; // 初始页码，默认为1
  fetchApi: any; // API 函数，返回数据及总数
  // 默认参数
  defaultParams?: any;
  // 首次是否请求
  firstNotGetData?: boolean;
  onSuccessCallback?: (data: any) => void;
  autoRefresh?: boolean; // 是否自动刷新
  refreshInterval?: number; // 自动刷新间隔，单位毫秒
  rowKey?: string;
}

const usePagination = <T>({
  initPageSize = 20,
  initPage = 1,
  initPageSizes = [10, 20, 30, 50, 100],
  fetchApi,
  defaultParams = {},
  firstNotGetData,
  onSuccessCallback,
  autoRefresh = false,
  refreshInterval = 5000, // 默认5秒
  rowKey = 'id',
}: UsePaginationParams) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const firstUpdate = useRef(firstNotGetData === true);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const totalRef = useRef(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [paramsData, setParamsData] = useState({
    pageSize: initPageSize,
    pageNo: initPage,
    searchFormData: {},
  });

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearTime = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const getData = (needLoading = true, { clearSelect }: { clearSelect?: boolean } = {}) => {
    clearTime();
    cancelRequest(); // 取消之前的请求
    abortControllerRef.current = new AbortController(); // 创建新的 AbortController
    if (needLoading) {
      setLoading(true);
    }
    fetchApi(
      {
        ...defaultParams,
        ...paramsData.searchFormData,
        pageSize: paramsData.pageSize,
        pageNo: paramsData.pageNo,
      },
      {
        signal: abortControllerRef.current.signal, // 传递 signal
      }
    )
      .then((data: any) => {
        if (abortControllerRef.current?.signal.aborted) {
          return; // 如果请求被中止，则不处理响应
        }
        setData(data?.data);
        totalRef.current = data?.total ?? 0;
        if (onSuccessCallback) {
          onSuccessCallback?.(data);
        }
        const page = data?.pageNo ?? 1;
        if (paramsData.pageNo !== page) {
          setParamsData((o) => ({ ...o, pageNo: page }));
        }
        if (data?.data?.length === 0 && data?.pageNo > 1) {
          setParamsData((o) => ({ ...o, pageNo: data?.pageNo - 1 }));
        }
      })
      .catch((error: any) => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          // 处理其他错误
          console.error('Fetch error:', error);
        }
      })
      .finally(() => {
        if (clearSelect) {
          setSelectedRows([]);
          setSelectedRowKeys([]);
        }
        if (needLoading) {
          setLoading(false);
        }
        if (autoRefresh) {
          refreshTimerRef.current = setTimeout(() => getData(false), refreshInterval);
        }
      });
  };

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      if (autoRefresh && !firstNotGetData) {
        // 如果首次不请求数据，但开启了自动刷新，则在首次渲染后启动定时器
        refreshTimerRef.current = setTimeout(() => getData(false), refreshInterval);
      }
      return;
    }
    getData();

    return () => {
      clearTime();
      cancelRequest(); // 组件卸载时取消请求
    };
  }, [paramsData, autoRefresh, refreshInterval]);

  const onPageChange = useCallback((page: number | { page: number; pageSize: number }) => {
    clearTime();
    cancelRequest();
    if (typeof page === 'number') {
      setParamsData((o) => ({
        ...o,
        pageNo: page !== 0 ? page : page + 1,
      }));
    } else {
      setParamsData((o) => ({
        ...o,
        pageNo: page.page,
        pageSize: page.pageSize,
      }));
    }
  }, []);

  const reload = useCallback(() => {
    clearTime();
    cancelRequest();
    setParamsData((o) => ({
      ...o,
      pageNo: 1, // 重置页数为 1
    }));
  }, []);

  // 参数请求
  const setSearchParams = useCallback((value: any) => {
    clearTime();
    cancelRequest();
    setParamsData((o) => ({
      ...o,
      pageNo: 1, // 重置页数为 1
      searchFormData: value || {},
    }));
  }, []);

  const onShowPageSizeChange = useCallback((pageNo: number, pageSize: number) => {
    clearTime();
    cancelRequest();
    setParamsData((o) => ({
      ...o,
      pageNo,
      pageSize,
    }));
  }, []);

  const setPagination = (pageNo: number, pageSize?: number) => {
    clearTime();
    cancelRequest();
    setParamsData((o) => ({
      ...o,
      pageNo,
      pageSize: pageSize || o.pageSize,
    }));
  };

  const clearData = () => {
    clearTime();
    cancelRequest();
    setData([]);
    totalRef.current = 0;
  };
  const rowSelectionChange = (a: Key[], b?: any[]) => {
    setSelectedRowKeys(a);
    if (b) {
      setSelectedRows(b);
    } else {
      setSelectedRows(a?.map((aa) => data?.find((f: any) => f[rowKey] === aa))?.filter((f) => f));
    }
  };

  return {
    setLoading,
    loading,
    data,
    reload,
    refreshRequest: getData,
    pagination: {
      // 总共多少个操作数字
      totalItems: totalRef.current,
      // 当前页
      page: paramsData.pageNo,
      pageSize: paramsData.pageSize,
      pageSizes: initPageSizes,
      onChange: onPageChange,
      onShowSizeChange: onShowPageSizeChange,
      total: totalRef.current,
    },
    setSearchParams,
    setPagination,
    clearData,
    rowSelection: {
      selectedRowKeys,
      onChange: rowSelectionChange,
    },
    selectedRows,
  };
};

export default usePagination;
