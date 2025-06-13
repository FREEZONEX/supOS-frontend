import { CSSProperties, Key, ReactNode, MouseEvent } from 'react';
import { TreeProps } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { DataNode } from 'antd/es/tree';

export interface DataNodeProps extends DataNode {
  // 是否有更多节点
  isLoadMoreNode?: boolean;
  // 父级key
  parentKey?: Key;
  key: Key;
  [key: string]: any;
}

// 组件属性类型
export interface ProTreeProps extends TreeProps {
  // 基础属性
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  // 空元素配置
  empty?: ReactNode;
  // 样式相关
  wrapperStyle?: CSSProperties;
  wrapperClassName?: string;
  treeNodeClassName?: string;
  // 特殊样式
  specialStyle?: boolean;
  // 搜索相关
  // 右键菜单相关
  rightClickMenuItems?: ((info: { event: MouseEvent; node: DataNodeProps }) => ItemType[]) | ItemType[];
  // 左侧icon
  treeNodeIcon?: ReactNode | ((dataNode: DataNodeProps) => ReactNode);
  // 右侧操作项
  treeNodeExtra?: ReactNode | ((dataNode: DataNodeProps) => ReactNode);
  // 数量
  treeNodeCount?: ReactNode | ((dataNode: DataNodeProps) => ReactNode);
  // 分页懒加载触发
  loadMoreData?: (dataNode: DataNodeProps) => void; // Callback when a 'load more' node is rendered
  // 懒加载
  lazy?: boolean;
  // 是否显示展开图标
  showSwitcherIcon?: boolean;
  // 匹配高亮
  matchHighlightValue?: string;
}

// 组件引用类型
export interface ProTreeRef {
  scrollTo?: (info: { key: Key; align?: 'top' | 'bottom' | 'auto'; offset?: number }) => void;
}
