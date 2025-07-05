import { FC, useState } from 'react';
import { App, Button, Form, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { addFlow, copyFlow, deleteFlow, editFlow, flowPage } from '@/apis/inter-api/flow';
import { usePagination, useTranslate } from '@/hooks';
import { PageProps } from '@/common-types.ts';
import { useActivate } from '@/contexts/tabs-lifecycle-context';
import { ButtonPermission } from '@/common-types/button-permission.ts';
import { CopyFile, Edit, Search, TrashCan } from '@carbon/icons-react';
import ComDrawer from '@/components/com-drawer';
import ComLayout from '@/components/com-layout';
import ComContent from '@/components/com-layout/ComContent';
import ComSearch from '@/components/com-search';
import OperationForm from '@/components/operation-form';
import { validInputPattern } from '@/utils/pattern';
import { getSearchParamsString } from '@/utils/url-util';
import { AuthButton, AuthWrapper } from '@/components/auth';
import { ComTableList } from '@/components';
import OperationButtons from '@/components/operation-buttons';

const CollectionFlow: FC<PageProps> = ({ title }) => {
  const { modal } = App.useApp();
  const formatMessage = useTranslate();
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState('create');
  const [apiLoading, setApiLoading] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [show, setShow] = useState(false);

  const { loading, pagination, data, reload, refreshRequest, setSearchParams } = usePagination({
    fetchApi: flowPage,
  });

  const runStatusOptions = [
    {
      value: 'RUNNING',
      text: formatMessage('common.running'),
      bgType: 'green',
    },
    {
      value: 'PENDING',
      text: formatMessage('common.pending'),
      bgType: 'purple',
    },
    {
      value: 'STOPPED',
      text: formatMessage('common.stopped'),
      bgType: 'red',
    },
    {
      value: 'DRAFT',
      text: formatMessage('common.draft'),
      bgType: 'blue',
    },
  ];
  const titleStatehandle = (item: any) => {
    return runStatusOptions?.find((f: any) => f.value === item.flowStatus)?.text || item.flowStatus;
  };
  const formItemOptions = (isEdit: string) => [
    {
      label: `${formatMessage(`collectionFlow.${isEdit}Flow`)}`,
    },
    {
      label: formatMessage('common.name'),
      name: 'flowName',
      rules: [
        { required: true, message: formatMessage('rule.required') },
        { pattern: validInputPattern, message: formatMessage('rule.illegality') },
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
        disabled: isEdit !== 'create',
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
  useActivate(() => {
    refreshRequest?.();
  });
  const onClose = () => {
    setShow(false);
    form.resetFields();
  };
  const onAddHandle = () => {
    setIsEdit('create');
    form.resetFields();
    if (show) return;
    setShow(true);
  };
  const onSave = async () => {
    const values = await form.validateFields();
    setApiLoading(true);
    const apiObj: any = {
      copy: copyFlow,
      edit: editFlow,
      create: addFlow,
    };
    const api = apiObj[isEdit || 'create'];
    api({
      ...values,
      template: isEdit === 'edit' ? undefined : values.template,
      id: isEdit === 'edit' ? values.id : undefined,
      sourceId: isEdit === 'copy' ? values.id : undefined,
    })
      .then(() => {
        refreshRequest();
        onClose();
      })
      .finally(() => {
        setApiLoading(false);
      });
  };
  const onDeleteHandle = (item: any) => {
    deleteFlow(item.id).then(() => {
      reload();
    });
  };
  const onEditHandle = (item: any) => {
    setIsEdit('edit');
    setShow(true);
    form.setFieldsValue({
      ...item,
    });
  };
  return (
    <ComLayout loading={loading}>
      <ComContent
        title={title}
        mustHasBack={false}
        style={{
          padding: '30px',
          overflow: 'hidden',
        }}
        extra={
          <>
            <ComSearch
              form={searchForm}
              formItemOptions={[
                {
                  name: 'k',
                  properties: {
                    prefix: <Search />,
                    placeholder: formatMessage('common.searchPlaceholder'),
                    style: { width: 300 },
                    allowClear: true,
                  },
                },
              ]}
              formConfig={{
                onFinish: () => {
                  setSearchParams(searchForm.getFieldsValue());
                },
              }}
              onSearch={() => {
                setSearchParams(searchForm.getFieldsValue());
              }}
            />
            <AuthButton auth={ButtonPermission['collectionFlow.add']} type="primary" onClick={onAddHandle}>
              + {formatMessage('collectionFlow.newFlow')}
            </AuthButton>
          </>
        }
      >
        <ComTableList
          className="flow-table-list"
          columns={[
            {
              title: formatMessage('common.name'),
              dataIndex: 'flowName',
              width: '30%',
              render: (text, item) => (
                <>
                  <AuthWrapper auth={ButtonPermission['collectionFlow.design']}>
                    <Button
                      type="link"
                      onClick={() => {
                        navigate(
                          `/collection-flow/flow-editor?${getSearchParamsString({ id: item.id, name: item.flowName, status: item.flowStatus, flowId: item.flowId, from: location.pathname })}`
                        );
                      }}
                      title={text}
                    >
                      {text}
                    </Button>
                  </AuthWrapper>
                  {item.flowStatus && (
                    <Tag
                      style={{ borderRadius: 15, lineHeight: '16px', margin: 0 }}
                      bordered={false}
                      color={(runStatusOptions?.find((f: any) => f.value === item.flowStatus)?.bgType || 'red') as any}
                    >
                      {titleStatehandle(item)}
                    </Tag>
                  )}
                </>
              ),
            },
            {
              title: formatMessage('collectionFlow.flowTemplate'),
              dataIndex: 'template',
              width: '25%',
            },
            {
              title: formatMessage('common.description'),
              dataIndex: 'description',
              width: '30%',
              ellipsis: true,
            },
            {
              title: '',
              dataIndex: 'operation',
              width: '10%',
              align: 'right',
              fixed: 'right',
              render: (_, record) => (
                <OperationButtons
                  className="list-operation"
                  options={[
                    {
                      label: '',
                      onClick: (item: any) => {
                        setIsEdit('copy');
                        setShow(true);
                        form.setFieldsValue({
                          id: item.id,
                        });
                      },
                      type: 'link',
                      btnProps: {
                        title: formatMessage('common.copy'),
                        icon: <CopyFile />,
                      },
                      auth: ButtonPermission['collectionFlow.copy'],
                    },
                    {
                      label: '',
                      onClick: onEditHandle,
                      type: 'link',
                      btnProps: {
                        title: formatMessage('common.edit'),
                        icon: <Edit />,
                      },
                      auth: ButtonPermission['collectionFlow.edit'],
                    },
                    {
                      label: '',
                      onClick: (item) =>
                        modal.confirm({
                          title: formatMessage('common.deleteConfirm'),
                          onOk: () => onDeleteHandle(item),
                          okText: formatMessage('common.confirm'),
                        }),
                      type: 'link',
                      btnProps: {
                        title: formatMessage('common.delete'),
                        icon: <TrashCan />,
                      },
                      auth: ButtonPermission['collectionFlow.delete'],
                    },
                  ]}
                  record={record}
                />
              ),
            },
          ]}
          dataSource={data as any}
          pagination={pagination}
        />
      </ComContent>
      <ComDrawer title=" " open={show} onClose={onClose}>
        <OperationForm
          loading={apiLoading}
          form={form}
          onCancel={onClose}
          onSave={onSave}
          formItemOptions={formItemOptions(isEdit)}
        />
      </ComDrawer>
    </ComLayout>
  );
};

export default CollectionFlow;
