import { useState, useEffect, FC, CSSProperties, useRef } from 'react';
import { getModelInfo, modifyModel } from '@/apis/inter-api/uns';
import { useTranslate } from '@/hooks';
import { Collapse, App, theme, Typography, Flex, Tag } from 'antd';
import { CaretRight, Folder } from '@carbon/icons-react';
import Icon from '@ant-design/icons';
import DocumentList from '@/pages/uns/components/DocumentList.tsx';
import UploadButton from '@/pages/uns/components/UploadButton.tsx';
import EditButton from '@/pages/uns/components/EditButton.tsx';
import { ButtonPermission } from '@/common-types/button-permission.ts';
import EditDetailButton from '@/pages/uns/components/EditDetailButton.tsx';
import type { InitTreeDataFnType, UnsTreeNode } from '@/pages/uns/types';
import { formatTimestamp } from '@/utils/format';
import ProTable from '@/components/pro-table';
import FileEdit from '@/components/svg-components/FileEdit';
import { hasPermission } from '@/utils/auth';
import { useBaseStore } from '@/stores/base';
const { Title } = Typography;

const panelStyle: CSSProperties = {
  background: 'val(--supos-bg-color)',
  border: 'none',
};

export interface FolderDetailProps {
  currentNode: UnsTreeNode;
  initTreeData: InitTreeDataFnType;
}

const Module: FC<FolderDetailProps> = (props) => {
  const { message } = App.useApp();
  const {
    currentNode: { id, countChildren },
    initTreeData,
  } = props;
  const documentListRef = useRef();
  const formatMessage = useTranslate();
  const systemInfo = useBaseStore((state) => state.systemInfo);
  const [activeList, setActiveList] = useState<string[]>(['detail', 'definition', 'document']);
  const { token } = theme.useToken();

  const [modelInfo, setModelInfo] = useState<{ [key: string]: any }>({});

  const getModel = (id: string) => {
    getModelInfo({ id })
      .then((data: any) => {
        setModelInfo(data || {});
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (id) {
      getModel(id as string);
    }
  }, [id]);

  const items = [
    {
      key: 'detail',
      label: <span>{formatMessage('common.detail')}</span>,
      children: (
        <>
          <div className="detailItem">
            <div className="detailKey"> {formatMessage('uns.alias')}</div>
            <div>{modelInfo.alias}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('uns.displayName')}</div>
            <div>{modelInfo.displayName}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey"> {formatMessage('uns.description')}</div>
            <div>{modelInfo.description}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey"> {formatMessage('uns.sourceTemplate')}</div>
            <div>{modelInfo.modelName ? `${modelInfo.modelName}（${modelInfo.templateAlias}）` : ''}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('common.creationTime')}</div>
            <div>{formatTimestamp(modelInfo.createTime)}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('uns.namespace')}</div>
            <div>{modelInfo.path}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('uns.instanceCountStatistics')}</div>
            <div>{countChildren}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('uns.originalName')}</div>
            <div>{modelInfo.name}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('common.latestUpdate')}</div>
            {(modelInfo.updateTime || modelInfo.createTime) && (
              <div>{formatTimestamp(modelInfo.updateTime || modelInfo.createTime)}</div>
            )}
          </div>
          {modelInfo.extend &&
            Object.keys(modelInfo.extend).map((item: string, index: number) => (
              <div className="detailItem" key={index}>
                <div className="detailKey">{item}</div>
                <div>
                  {modelInfo.extend[item]}
                  <Tag style={{ marginLeft: '8px' }}>{formatMessage('uns.expandedInformation')}</Tag>
                </div>
              </div>
            ))}
        </>
      ),
      style: panelStyle,
      extra: (
        <EditDetailButton
          auth={ButtonPermission['uns.editFolderDetail']}
          type="folder"
          modelInfo={modelInfo}
          getModel={() => getModel(id as string)}
        />
      ),
    },
    {
      key: 'definition',
      label: formatMessage('uns.definition'),
      extra: (
        <EditButton
          auth={ButtonPermission['uns.definition']}
          modelInfo={modelInfo}
          getModel={() => getModel(id as string)}
        />
      ),
      children: (
        <ProTable
          rowKey={'name'}
          bordered={true}
          rowHoverable={false}
          columns={[
            {
              title: formatMessage('common.name'),
              dataIndex: 'name',
              width: '20%',
            },
            {
              title: formatMessage('uns.type'),
              dataIndex: 'type',
              width: '20%',
              render: (text) => <span style={{ color: 'var(--supos-theme-color)' }}>{text}</span>,
            },
            {
              title: formatMessage('common.length'),
              dataIndex: 'maxLen',
              width: '20%',
              render: (text) => <span style={{ color: 'var(--supos-theme-color)' }}>{text}</span>,
            },
            {
              title: formatMessage('uns.displayName'),
              dataIndex: 'displayName',
              width: '20%',
              render: (text) => <span style={{ color: 'var(--supos-theme-color)' }}>{text}</span>,
            },
            {
              title: formatMessage('uns.remark'),
              dataIndex: 'remark',
              width: '20%',
              render: (text) => <span style={{ color: 'var(--supos-theme-color)' }}>{text}</span>,
            },
          ]}
          dataSource={modelInfo?.fields || []}
          hiddenEmpty
          pagination={false}
          size="middle"
        />
      ),
      style: panelStyle,
    },
    {
      key: 'document',
      label: formatMessage('common.document'),
      children: <DocumentList alias={modelInfo.alias} ref={documentListRef} />,
      style: panelStyle,
      extra: (
        <UploadButton
          auth={ButtonPermission['uns.uploadDoc']}
          alias={modelInfo.alias}
          documentListRef={documentListRef}
        />
      ),
    },
  ];
  return (
    <div className="topicDetailWrap">
      <div className="topicDetailContent">
        <Flex className="detailTitle" gap={8} align="center">
          <Folder size={20} />
          <Title
            level={2}
            style={{ margin: 0, width: '100%', insetInlineStart: 0 }}
            editable={
              hasPermission(ButtonPermission['uns.editFolderName']) && systemInfo?.useAliasPathAsTopic
                ? {
                    icon: (
                      <Icon
                        data-button-auth={ButtonPermission['uns.editFolderName']}
                        component={FileEdit}
                        style={{
                          fontSize: 25,
                          color: 'var(--supos-text-color)',
                        }}
                      />
                    ),
                    onChange: (val) => {
                      if (val === modelInfo.pathName || !val) return;
                      if (val.length > 63) {
                        return message.warning(
                          formatMessage('uns.labelMaxLength', { label: formatMessage('common.name'), length: 63 })
                        );
                      }
                      modifyModel({ id, name: val }).then(() => {
                        message.success(formatMessage('uns.editSuccessful'));
                        getModel(id as string);
                        initTreeData({ queryType: 'editFolderName' });
                      });
                    },
                  }
                : false
            }
          >
            {modelInfo.pathName}
          </Title>
        </Flex>
        <div className="tableWrap">
          <Collapse
            bordered={false}
            collapsible="header"
            activeKey={activeList}
            onChange={(even) => setActiveList(even)}
            expandIcon={({ isActive }) => (
              <CaretRight
                size={20}
                style={{
                  rotate: isActive ? '90deg' : '0deg',
                  transition: '200ms',
                }}
              />
            )}
            items={items}
            style={{ background: token.colorBgContainer }}
          />
        </div>
      </div>
    </div>
  );
};
export default Module;
