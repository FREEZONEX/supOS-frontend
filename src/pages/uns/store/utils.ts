import { Key } from 'react';
import _ from 'lodash';
import { UnsTreeNode } from '@/pages/uns/types';

// 根据当前节点id获取链路
export const getParentNodes = (tree: UnsTreeNode[], targetId: Key): UnsTreeNode[] => {
  const result: UnsTreeNode[] = [];

  // 定义递归查找函数
  const findNode = (nodes: UnsTreeNode[], targetId: Key): boolean => {
    for (const node of nodes) {
      // 如果当前节点匹配目标节点
      if (node.id === targetId) {
        result.push(node);
        return true;
      }

      // 如果有子节点，递归查找
      if (node.children && node.children.length > 0) {
        if (findNode(node.children, targetId)) {
          result.push(node); // 找到目标节点后，将当前节点加入结果
          return true;
        }
      }
    }
    return false;
  };

  // 开始查找
  const found = findNode(tree, targetId);

  // 如果找到目标节点，返回结果数组（反转以确保顺序从父到子）
  return found ? result.reverse() : [];
};

// 数据重组出pathName
export const handlerTreeData = (treeData: UnsTreeNode[]) => {
  const modifyTreeData = (data: UnsTreeNode[], path?: string) => {
    data.forEach((node: UnsTreeNode) => {
      node.parentPath = path || '';
      // 真实展示的name
      const pathName = node?.path?.split('/').slice(-1)[0];
      node.pathName = pathName;
      node.title = pathName;
      node.key = node.id as string;
      // 不需要设置叶子节点,因为是整棵树，会根据children来判断
      // node.isLeaf = !node.hasChildren;
      if (node.children && node.children.length) {
        modifyTreeData(node.children, node.path);
      }
    });
  };
  modifyTreeData(treeData);
  return treeData;
};

// 递归获取所有后代 key
export function getDescendantKeys(nodes: UnsTreeNode[], parentKey: any) {
  let result: any = [];
  for (const node of nodes) {
    if (node.key === parentKey && node.children) {
      for (const child of node.children) {
        result.push(child.key);
        result = result.concat(getDescendantKeys(nodes, child.key));
      }
    } else if (node.children) {
      result = result.concat(getDescendantKeys(node.children, parentKey));
    }
  }
  return result;
}

// 递归清空子chidren
export function setTreeDescendantChildren(draft: UnsTreeNode[], nodeKey: string) {
  // 递归查找并更新节点
  const updateNode = (nodes: any) => {
    for (const node of nodes) {
      if (node.key === nodeKey && node.children?.length > 0) {
        node.children = [];
        return true;
      } else if (node.children) {
        if (updateNode(node.children)) {
          return true;
        }
      }
    }
    return false;
  };
  updateNode(draft);
}

// 递归查找信息
export function findNodeInfoById(draft: any, nodeKey: string) {
  const findNodeInTree = (nodes: UnsTreeNode[]): UnsTreeNode | undefined => {
    for (const node of nodes) {
      if (node.key === nodeKey || node.id === nodeKey) {
        return node;
      }

      if (node.children && node.children.length > 0) {
        const foundInChildren = findNodeInTree(node.children);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return undefined;
  };

  return findNodeInTree(draft);
}

// 追加分页数据方法
export const appendTreeData = (
  list: UnsTreeNode[],
  key: Key,
  childrenToAppend: UnsTreeNode[],
  type?: string
): UnsTreeNode[] => {
  // 使用深度优先搜索找到目标节点并直接修改
  const findAndAppend = (nodes: UnsTreeNode[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.key === key) {
        // 移出更多，然后加上新值
        const existingChildren = node.children?.filter((child) => !(child as any).isLoadMoreNode) || [];
        node.children = [...existingChildren, ...childrenToAppend];
        // 特殊处理
        if (type === 'addFile') {
          node.hasChildren = true;
          node.isLeaf = false;
          node.countChildren = (node.countChildren ?? 0) + 1;
        } else if (type === 'addFolder') {
          node.hasChildren = true;
          node.isLeaf = false;
        }
        return true; // 找到并修改成功
      }

      if (node.children && node.children.length > 0) {
        if (findAndAppend(node.children)) {
          return true; // 在子节点中找到并修改成功
        }
      }
    }
    return false; // 未找到目标节点
  };

  // 判断是否在immer环境中
  if (Object.isFrozen(list)) {
    // 非immer环境，创建副本
    const result = _.cloneDeep(list);
    findAndAppend(result);
    return result;
  } else {
    // immer环境，直接修改
    findAndAppend(list);
    return list;
  }
};

/**
 * 将API返回的数据转换为树节点格式
 * @param data API返回的数据
 * @param parentPath 父节点路径
 * @returns 转换后的树节点数据
 */
export const formatNodeData = (data: any[], parentPath: string = ''): UnsTreeNode[] => {
  return data.map((item: any) => ({
    ...item,
    title: item.pathName,
    parentPath: parentPath,
    key: item.id,
    isLeaf: !item.hasChildren,
  }));
};

/**
 * 创建"加载更多"节点
 * @param parentId 父节点ID
 * @param parentInfo 父节点信息
 * @returns 加载更多节点
 */
export const createLoadMoreNode = (
  parentId: string | number,
  currentPage: number,
  parentInfo?: UnsTreeNode,
  loadMoreText?: string
): UnsTreeNode => {
  return {
    parentInfo,
    title: loadMoreText || '加载更多...',
    key: `${parentId}-loadmore`,
    parentKey: parentId,
    isLeaf: true,
    isLoadMoreNode: true,
    currentPage,
  };
};

/**
 * 检查是否有更多数据
 * @param total 总数
 * @param pageNo 当前页码
 * @param pageSize 每页大小
 * @returns 是否有更多数据
 */
export const hasMoreData = (restResponse: { total: number; pageNo: number; pageSize: number }): boolean => {
  const { total, pageNo, pageSize } = restResponse;
  return total > pageNo * pageSize;
};

export const uniqueArr = (arr: any[]) => {
  return arr.reduce((acc, current) => {
    if (!acc.find((item: any) => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, []);
};
