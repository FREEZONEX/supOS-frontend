import { DataNodeProps } from '@/components/pro-tree';
import { Key } from 'react';

export interface UnsTreeNode extends Omit<DataNodeProps, 'children'> {
  key: Key;
  id?: Key;
  parentId?: Key;
  path?: string;
  parentPath?: string;
  type?: number | null;
  name?: string;
  alias?: string;
  parentAlias?: string;
  children?: UnsTreeNode[];
  // 子孙文件的个数
  countChildren?: number;
  // 是否有子集
  hasChildren?: boolean;
  [key: string]: any;
}

export interface FieldItem {
  name: string;
  type: string;
  displayName?: string;
  remark?: string;
  unique?: boolean;
  index?: number | string;
  isDefault?: boolean;
  maxLen?: number;
}

interface InitTreeDataParamsType {
  reset?: boolean;
  query?: string;
  type?: number;
  [key: string]: any;
}

export type InitTreeDataFnType = (params: InitTreeDataParamsType, cb?: () => void) => void;
