import { Dashboard, LabelDetail, ModelDetail, RealTimeData, TemplateDetail, TopicDetail } from '@/pages/uns/components';
import EmptyDetail from '@/pages/uns/components/EmptyDetail.tsx';
import { getTreeStoreSnapshot, useTreeStore, useTreeStoreRef } from './store/treeStore';
import { FC } from 'react';
import { UnsTreeNode } from '@/pages/uns/types';

interface DetailDomProps {
  handleDelete: (item: UnsTreeNode) => void;
  currentUnusedTopicNode?: any;
}

const DetailDom: FC<DetailDomProps> = ({ handleDelete, currentUnusedTopicNode }) => {
  const { treeMap, currentTreeMapType, selectedNode } = useTreeStore((state) => ({
    treeMap: state.treeMap,
    currentTreeMapType: state.currentTreeMapType,
    selectedNode: state.selectedNode,
  }));

  const stateRef = useTreeStoreRef();
  const { loadData } = getTreeStoreSnapshot(stateRef, (state) => ({
    loadData: state.loadData,
  }));

  const getDetailDom = (selectedNode?: UnsTreeNode) => {
    if (!selectedNode) return <EmptyDetail />;
    switch (selectedNode.type) {
      case 0:
        return <ModelDetail currentNode={selectedNode} initTreeData={loadData} />;
      case 1:
        return <TemplateDetail currentNode={selectedNode} handleDelete={handleDelete} initTreeData={loadData} />;
      case 2:
        return <TopicDetail currentNode={selectedNode} handleDelete={handleDelete} initTreeData={loadData} />;
      case 9:
        return <LabelDetail currentNode={selectedNode} handleDelete={handleDelete} initTreeData={loadData} />;
      default:
        return <EmptyDetail />;
    }
  };
  return treeMap ? (
    <Dashboard />
  ) : currentTreeMapType === 'all' ? (
    getDetailDom(selectedNode)
  ) : (
    <RealTimeData currentNode={currentUnusedTopicNode} />
  );
};

export default DetailDom;
