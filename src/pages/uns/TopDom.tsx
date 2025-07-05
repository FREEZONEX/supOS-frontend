import { Flex } from 'antd';
import { Copy, Rss } from '@carbon/icons-react';
import { ButtonPermission } from '@/common-types/button-permission';
import { getTreeStoreSnapshot, useTreeStore, useTreeStoreRef } from './store/treeStore';
import { useClipboard, useTranslate } from '@/hooks';
import { FC, ReactNode, useCallback, useRef, useState } from 'react';
import { ExportModal, ImportModal } from '@/pages/uns/components';
import { AuthButton } from '@/components/auth';
import ComBreadcrumb from '@/components/com-breadcrumb';
import ComText from '@/components/com-text';
import { useBaseStore } from '@/stores/base';

interface TopDomProps {
  setCurrentUnusedTopicNode: any;
  unusedTopicBreadcrumbList: any;
  currentUnusedTopicNode: any;
}
const TopDom: FC<TopDomProps> = ({ setCurrentUnusedTopicNode, unusedTopicBreadcrumbList, currentUnusedTopicNode }) => {
  const systemInfo = useBaseStore((state) => state.systemInfo);
  const formatMessage = useTranslate();
  const [importModal, setImportModal] = useState(false);
  const exportRef = useRef<any>(null);
  const copyPathRef = useRef(null);
  const { treeType, currentTreeMapType, breadcrumbList, selectedNode, setSelectedNode } = useTreeStore((state) => ({
    treeType: state.treeType,
    currentTreeMapType: state.currentTreeMapType,
    breadcrumbList: state.breadcrumbList,
    selectedNode: state.selectedNode,
    setSelectedNode: state.setSelectedNode,
  }));

  useClipboard(
    copyPathRef,
    currentTreeMapType === 'all' ? breadcrumbList.slice(-1)?.[0]?.path : currentUnusedTopicNode.path
  );

  const getTopicBreadcrumb = useCallback(
    (pArr: any[], addonAfter?: ReactNode | false) => (
      <ComBreadcrumb
        style={{ fontWeight: 700 }}
        // separator=">"
        items={pArr?.map((e: any, idx: number) => {
          const name = currentTreeMapType === 'all' ? e.name : e.pathName || e.name;
          if (idx + 1 === pArr?.length) {
            return {
              title: name,
            };
          }
          return {
            title: <ComText>{name}</ComText>,
            onClick: () => {
              if (currentTreeMapType === 'all') {
                setSelectedNode(e);
              } else {
                setCurrentUnusedTopicNode(e);
              }
            },
          };
        })}
        addonAfter={
          addonAfter ? (
            addonAfter
          ) : addonAfter === false ? null : (
            <div className="copyBox" ref={copyPathRef} title={formatMessage('common.copy')}>
              <Copy />
            </div>
          )
        }
      />
    ),
    [setCurrentUnusedTopicNode, setSelectedNode, currentTreeMapType]
  );

  const stateRef = useTreeStoreRef();
  const { loadData } = getTreeStoreSnapshot(stateRef, (state) => ({
    loadData: state.loadData,
  }));

  return (
    <div className="chartTop">
      {treeType === 'uns' ? (
        <div className="chartTopL">
          {currentTreeMapType === 'all' && selectedNode?.id
            ? getTopicBreadcrumb(
                breadcrumbList,
                selectedNode.type === 0 ? (
                  false
                ) : selectedNode.type === 2 && systemInfo.useAliasPathAsTopic ? (
                  <Flex
                    align="center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const scrollWrap = document.querySelector('.topicDetailContent');
                      const targetNode = document.getElementById('sqlQuery');
                      if (scrollWrap && targetNode) {
                        const diffY =
                          scrollWrap.scrollTop +
                          targetNode.getBoundingClientRect().top -
                          scrollWrap.getBoundingClientRect().top;
                        scrollWrap.scrollTo({
                          top: diffY,
                          behavior: 'smooth',
                        });
                      }
                    }}
                    title={formatMessage('common.subscribe')}
                  >
                    <Rss />
                  </Flex>
                ) : null
              )
            : null}
          {currentTreeMapType === 'unusedTopic' && currentUnusedTopicNode.id
            ? getTopicBreadcrumb(unusedTopicBreadcrumbList)
            : null}
        </div>
      ) : (
        <span />
      )}
      <div className="chartTopR">
        <AuthButton auth={ButtonPermission['uns.importNamespace']} type="primary" onClick={() => setImportModal(true)}>
          {formatMessage('common.import')}
        </AuthButton>
        <AuthButton
          auth={ButtonPermission['uns.export']}
          color="default"
          variant="filled"
          style={{ background: '#c6c6c6', color: '#161616' }}
          onClick={() => {
            exportRef.current?.setOpen(true);
          }}
        >
          {formatMessage('uns.export')}
        </AuthButton>
      </div>
      <ImportModal importModal={importModal} setImportModal={setImportModal} initTreeData={loadData} />
      <ExportModal exportRef={exportRef} />
    </div>
  );
};

export default TopDom;
