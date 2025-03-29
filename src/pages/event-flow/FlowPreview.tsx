import { FC, useEffect, useRef, useState } from 'react';
import { ComLayout, ComContent, AuthButton, AuthWrapper, ComDrawer, OperationForm } from '@/components';
import { useNavigate } from 'react-router-dom';
import { App, Button, Dropdown, Form, message, Space, Breadcrumb } from 'antd';
import { copyFlow, deployFlow, saveFlow } from '@/apis/inter-api/event-flow';
import { Pending } from '@carbon/icons-react';
import { useLocalStorage, useTranslate } from '@/hooks';
import { useUpdateEffect } from 'ahooks';
import { PageProps } from '@/common-types';
import { ButtonPermission } from '@/common-types/button-permission.ts';
import { getDevProxyBaseUrl, getSearchParamsObj, getSearchParamsString, validInputPattern } from '@/utils';
import './index.scss';
import ComText from '@/components/com-text';

const EventFlowPreview: FC<PageProps> = ({ location }) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [show, setShow] = useState(false);
  const state = getSearchParamsObj(location?.search) || {};
  const navigate = useNavigate();
  const iframeUrl = `/eventflow/home/?sup_event_flow_id=${state.id}&sup_origin_event_flow_id=${state.flowId}`;
  const breadcrumbList = [
    {
      name: 'event-flow',
      path: '/EventFlow',
    },
    {
      name: state.name,
    },
  ];
  const formatMessage = useTranslate();
  const nodeRedLang = useLocalStorage('editor-language');
  const flowIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  // const [buttonDisabled, setDisabled] = useState(state?.status === 'RUNNING');
  const loadRef = useRef(false);
  // iframe的key
  const [key, setKey] = useState(Date.now());
  useUpdateEffect(() => {
    if (!loadRef.current) return;
    if (nodeRedLang) {
      setKey(Date.now());
    }
  }, [nodeRedLang]);
  // 将 flows 数据保存到后端
  const saveFlowsToBackend = async (data: any) => {
    try {
      const { flows, type } = data;
      // 需要过滤掉type为tab的数据
      const filterFlows = flows?.filter((item: any) => item.type !== 'tab');
      const api = type === 'save' ? saveFlow : deployFlow;
      setLoading(true);
      api({
        flows: filterFlows,
        id: state?.id,
      })
        .then((flowId: any) => {
          if (type === 'deploy') {
            if (!state.flowId && flowId) {
              navigate(`/EvenFlowEditor?${getSearchParamsString({ ...state, flowId: flowId })}`, {
                replace: true,
              });
            }
            setKey(Date.now());
            // setDisabled(true);
          } else {
            setLoading(false);
          }
          message.success(type === 'deploy' ? formatMessage('appGui.deployOk') : formatMessage('appGui.save'));
        })
        .catch(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error('Error saving flows:', error);
      setLoading(false);
    }
  };

  // 监听 iframe 加载
  useUpdateEffect(() => {
    const iframe = flowIframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [key]); // 依赖 iframeKey 的变化（重新加载时触发）

  useEffect(() => {
    setLoading(true);
    // 监听来自 Node-RED 的 flows 数据
    const handleMessage = (event: any) => {
      if (event.data.type === 'currentEventFlows') {
        saveFlowsToBackend(event.data.data);
      } else if (event.data.type === 'eventFlowsChange') {
        // setDisabled(!event.data?.data?.contentsChanged);
      }
    };

    const loadFn = () => {
      loadRef.current = true;
      setLoading(false);
    };
    if (flowIframeRef.current) {
      flowIframeRef.current.addEventListener('load', loadFn);
    }
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (flowIframeRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        flowIframeRef.current && flowIframeRef.current.removeEventListener('load', loadFn);
      }
    };
  }, [state?.id, state?.flowId]);

  const setPostMessage = (type: string) => {
    if (flowIframeRef.current) {
      setLoading(true);
      flowIframeRef.current.contentWindow!.postMessage({ data: type, type: 'requestEventFlows' }, '*');
    }
  };

  // 点击按钮请求 flows 数据
  const onSaveFlows = () => {
    setPostMessage('save');
  };

  const onDeployFlows = () => {
    setPostMessage('deploy');
  };

  const onCopyFlows = () => {
    setShow(true);
  };

  const onOpenMenuHandle = (id: string) => {
    if (flowIframeRef.current) {
      flowIframeRef.current.contentWindow!.postMessage({ data: { id }, type: 'openEventMenu' }, '*');
    }
  };

  const onClose = () => {
    setShow(false);
    form.resetFields();
  };

  const formItemOptions = [
    {
      label: formatMessage('collectionFlow.copy') + ' Flow',
    },
    {
      label: formatMessage('common.name'),
      name: 'flowName',
      rules: [
        { required: true, message: '' },
        { pattern: validInputPattern, message: '' },
      ],
    },
    {
      label: formatMessage('collectionFlow.flowTemplate'),
      name: 'template',
      type: 'Select',
      properties: {
        options: [
          {
            label: 'node-red',
            value: 'node-red',
          },
        ],
        disabled: true,
      },
      initialValue: 'node-red',
      rules: [{ required: true, message: '' }],
    },
    {
      label: formatMessage('uns.description'),
      name: 'description',
    },
    {
      label: 'id',
      name: 'id',
      hidden: true,
    },
    {
      type: 'divider',
    },
  ];

  const onSave = async () => {
    const values = await form.validateFields();
    setApiLoading(true);
    copyFlow({
      ...values,
      sourceId: state.id,
    })
      .then((data) => {
        setShow(false);
        modal.confirm({
          title: formatMessage('common.copyConfirm'),
          onOk: () => {
            form.resetFields();
            navigate(`/EvenFlowEditor?${getSearchParamsString({ id: data, name: values.flowName, status: 'DRAFT' })}`, {
              replace: true,
            });
          },
          onCancel: () => {
            form.resetFields();
          },
          cancelButtonProps: {
            // style: { color: '#000' },
          },
          okText: formatMessage('appSpace.confirm'),
        });
      })
      .finally(() => {
        setApiLoading(false);
      });
  };

  const items: any = [
    {
      key: 'menu-item-import',
      label: (
        <AuthWrapper auth={ButtonPermission['eventFlow.import']}>
          <span> {formatMessage('common.import')}</span>
        </AuthWrapper>
      ),
    },
    {
      key: 'menu-item-export',
      label: (
        <AuthWrapper auth={ButtonPermission['eventFlow.export']}>
          <span>{formatMessage('uns.export')}</span>{' '}
        </AuthWrapper>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'menu-item-search',
      label: (
        <AuthWrapper auth={ButtonPermission['eventFlow.process']}>
          <span>{formatMessage('flowEditor.process')}</span>
        </AuthWrapper>
      ),
    },
    {
      type: 'divider',
    },
    // {
    //   key: 'config-nodes',
    //   label: <span onClick={() => onOpenMenuHandle('menu-item-config-nodes')}>修改节点配置</span>,
    // },
    // {
    //   type: 'divider',
    // },
    {
      key: 'menu-item-edit-palette',
      label: (
        <AuthWrapper auth={ButtonPermission['eventFlow.nodeManagement']}>
          <span>{formatMessage('flowEditor.nodeManagement')}</span>
        </AuthWrapper>
      ),
    },
    // {
    //   type: 'divider',
    // },
    // {
    //   key: 'menu-item-user-settings',
    //   label: <span>设置</span>,
    // },
  ]?.filter((i) => i.type === 'divider' || i.label);
  return (
    <ComLayout loading={loading}>
      <ComContent
        backPath={'/EventFlow'}
        style={{ overflow: 'hidden' }}
        hasPadding
        border={false}
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Breadcrumb
              separator=">"
              items={breadcrumbList?.map((item: any, idx: number) => {
                if (idx + 1 === breadcrumbList?.length) {
                  return {
                    title: item.name,
                  };
                }
                return {
                  title: <ComText>{item.name}</ComText>,
                  onClick: () => {
                    if (!item.path) return;
                    navigate(item.path);
                  },
                };
              })}
            />
            <Space>
              <AuthButton
                auth={ButtonPermission['eventFlow.copy']}
                loading={loading}
                type="primary"
                onClick={onCopyFlows}
              >
                {formatMessage('collectionFlow.copy')}
              </AuthButton>
              <AuthButton
                auth={ButtonPermission['eventFlow.save']}
                loading={loading}
                type="primary"
                onClick={onSaveFlows}
              >
                {formatMessage('common.save')}
              </AuthButton>
              <AuthButton
                auth={ButtonPermission['eventFlow.deploy']}
                loading={loading}
                type="primary"
                onClick={onDeployFlows}
                // disabled={buttonDisabled}
              >
                {formatMessage('appGui.deploy')}
              </AuthButton>
              <Dropdown
                className="flow-dropdown"
                menu={{
                  onClick: (e) => {
                    onOpenMenuHandle(e.key);
                  },
                  items: items,
                }}
                placement="bottomRight"
              >
                <Button>
                  <Pending />
                </Button>
              </Dropdown>
            </Space>
          </div>
        }
      >
        <iframe
          key={key}
          ref={flowIframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={'Node-RED'}
          src={`${getDevProxyBaseUrl()}${iframeUrl}`}
        />
      </ComContent>
      <ComDrawer title=" " open={show} onClose={onClose}>
        <OperationForm
          loading={apiLoading}
          form={form}
          onCancel={onClose}
          onSave={onSave}
          formItemOptions={formItemOptions}
        />
      </ComDrawer>
    </ComLayout>
  );
};

export default EventFlowPreview;
