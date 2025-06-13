import { Flex } from 'antd';
import styles from './Permission.module.scss';
import { CSSProperties, forwardRef, useCallback, useImperativeHandle } from 'react';
import { ScisControlTower } from '@carbon/icons-react';
import { usePropsValue, useTranslate } from '@/hooks';
import { PermissionNode, PermissionRefProps } from './useRoleSetting';
import ComCheckbox from '@/components/com-checkbox';

interface PermissionProps {
  onChange?: (permissionData: PermissionNode[]) => void;
  value?: PermissionNode[];
  initValue?: PermissionNode[];
  style?: CSSProperties;
  // 是否都禁用
  disabled?: boolean;
}

const Permission = forwardRef<PermissionRefProps, PermissionProps>(
  ({ value, initValue, onChange, style, disabled }, ref) => {
    const formatMessage = useTranslate();
    // 使用状态管理权限数据
    const [permissionData, setPermissionData] = usePropsValue<PermissionNode[]>({
      value,
      defaultValue: initValue,
      onChange,
    });
    console.log(permissionData);

    useImperativeHandle(ref, () => {
      return {
        getValue: () => permissionData,
        setValue: (p) => setPermissionData(p),
      };
    }, [permissionData, setPermissionData]);

    // 更新节点及其子节点的选中状态
    const updateNodeAndChildren = useCallback(
      (nodes: PermissionNode[], nodeId: string, checked: boolean): PermissionNode[] => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            // 更新当前节点
            const updatedNode = { ...node, checked };

            // 如果有子节点，递归更新子节点
            if (node.children && node.children.length > 0) {
              updatedNode.children = node.children.map((child) => ({
                ...child,
                checked,
                // 如果子节点还有子节点，递归更新
                children: child.children
                  ? child.children.map((grandChild) => ({
                      ...grandChild,
                      checked,
                    }))
                  : undefined,
              }));
            }
            return updatedNode;
          } else if (node.children && node.children.length > 0) {
            // 递归查找并更新子节点
            return {
              ...node,
              children: updateNodeAndChildren(node.children, nodeId, checked),
            };
          }
          return node;
        });
      },
      []
    );

    // 更新页面权限
    const updatePagePermissions = useCallback(
      (nodes: PermissionNode[], groupId: string, checked: boolean): PermissionNode[] => {
        return nodes.map((node) => {
          if (node.id === groupId) {
            // 更新当前组的页面权限状态
            const updatedNode = { ...node, pagePermissionChecked: checked };

            // 更新子菜单的选中状态（页面权限）
            if (node.children && node.children.length > 0) {
              updatedNode.children = node.children.map((child) => {
                if (child.type === 'menu') {
                  return { ...child, checked };
                }
                return child;
              });
            }
            return updatedNode;
          } else if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updatePagePermissions(node.children, groupId, checked),
            };
          }
          return node;
        });
      },
      []
    );

    // 更新操作权限
    const updateActionPermissions = useCallback(
      (nodes: PermissionNode[], groupId: string, checked: boolean): PermissionNode[] => {
        return nodes.map((node) => {
          if (node.id === groupId) {
            // 更新当前组的操作权限状态
            const updatedNode = { ...node, actionPermissionChecked: checked };

            // 更新所有按钮的选中状态
            if (node.children && node.children.length > 0) {
              updatedNode.children = node.children.map((menu) => {
                if (menu.children && menu.children.length > 0) {
                  return {
                    ...menu,
                    children: menu.children.map((button) => {
                      if (button.type === 'button') {
                        return { ...button, checked };
                      }
                      return button;
                    }),
                  };
                }
                return menu;
              });
            }
            return updatedNode;
          } else if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updateActionPermissions(node.children, groupId, checked),
            };
          }
          return node;
        });
      },
      []
    );

    // 检查组的状态并更新
    const checkAndUpdateGroupState = useCallback((data: PermissionNode[]): PermissionNode[] => {
      return data.map((group) => {
        if (group.type === 'group' && group.children && group.children.length > 0) {
          // 检查所有菜单是否都被选中
          const allMenusChecked = group.children.every((menu) => (menu.type === 'menu' ? menu.checked : true));

          // 检查所有按钮是否都被选中
          let allButtonsChecked = true;
          group.children.forEach((menu) => {
            if (menu.children && menu.children.length > 0) {
              if (!menu.children.every((button) => button.checked)) {
                allButtonsChecked = false;
              }
            }
          });

          // 更新组的状态 - 菜单和按钮状态独立判断
          return {
            ...group,
            // 页面权限状态只取决于菜单是否全选
            pagePermissionChecked: allMenusChecked,
            // 操作权限状态只取决于按钮是否全选
            actionPermissionChecked: allButtonsChecked,
            // 组的选中状态取决于所有菜单和所有按钮是否都被选中
            checked: allMenusChecked && allButtonsChecked,
            children: group.children,
          };
        }
        return group;
      });
    }, []);

    // 处理组级别复选框变化
    const handleGroupCheckChange = useCallback(
      (groupId: string, checked: boolean) => {
        setPermissionData((prev: PermissionNode[]) => {
          // 更新组及其所有子节点
          const updated = updateNodeAndChildren(prev, groupId, checked);
          // 同时更新组的pagePermissionChecked和actionPermissionChecked状态
          return updated.map((node) => {
            if (node.id === groupId) {
              return {
                ...node,
                pagePermissionChecked: checked,
                actionPermissionChecked: checked,
              };
            }
            return node;
          });
        });
      },
      [updateNodeAndChildren]
    );

    // 处理页面权限复选框变化
    const handlePagePermissionChange = useCallback(
      (groupId: string, checked: boolean) => {
        setPermissionData((prev: PermissionNode[]) => {
          // 更新组的页面权限
          const updated = updatePagePermissions(prev, groupId, checked);
          // 检查并更新组的状态
          return checkAndUpdateGroupState(updated);
        });
      },
      [updatePagePermissions, checkAndUpdateGroupState]
    );

    // 处理操作权限复选框变化
    const handleActionPermissionChange = useCallback(
      (groupId: string, checked: boolean) => {
        setPermissionData((prev: PermissionNode[]) => {
          // 更新组的操作权限
          const updated = updateActionPermissions(prev, groupId, checked);
          // 检查并更新组的状态
          return checkAndUpdateGroupState(updated);
        });
      },
      [updateActionPermissions, checkAndUpdateGroupState]
    );

    // 处理菜单复选框变化
    const handleMenuCheckChange = useCallback(
      (menuId: string, checked: boolean) => {
        setPermissionData((prev: PermissionNode[]) => {
          // 只更新菜单节点本身，不影响按钮
          const updated = prev.map((node) => {
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: node.children.map((child) => {
                  if (child.id === menuId) {
                    // 只更新当前菜单的选中状态，不影响其子节点
                    return { ...child, checked };
                  }
                  return child;
                }),
              };
            }
            return node;
          });
          // 检查并更新组的状态
          return checkAndUpdateGroupState(updated);
        });
      },
      [checkAndUpdateGroupState]
    );

    // 处理按钮复选框变化
    const handleButtonCheckChange = useCallback(
      (buttonId: string, checked: boolean) => {
        setPermissionData((prev: PermissionNode[]) => {
          // 更新按钮
          const updated = updateNodeAndChildren(prev, buttonId, checked);
          // 检查并更新组的状态
          return checkAndUpdateGroupState(updated);
        });
      },
      [updateNodeAndChildren, checkAndUpdateGroupState]
    );

    return (
      <div className={styles['permission']} style={style}>
        {permissionData?.map((item: PermissionNode) => {
          return (
            <div
              key={item.id}
              style={{
                marginTop: 10,
                border: '1px solid var(--supos-t-dividr-color)',
              }}
            >
              <Flex
                align="center"
                style={{
                  height: 40,
                  padding: '0 16px',
                  background: 'var(--supos-table-head-color)',
                }}
              >
                {/*控制所有菜单和按钮的全选反选*/}
                <ComCheckbox
                  className={styles['menu-bar']}
                  label={
                    <Flex gap={4} align="center">
                      <ScisControlTower />
                      {item.menuNameKey ? formatMessage(item.menuNameKey) : item.name}
                    </Flex>
                  }
                  checked={item.checked}
                  disabled={disabled}
                  onChange={(e) => handleGroupCheckChange(item.id, e.target.checked)}
                />
              </Flex>
              {/* 快捷操作 */}
              <Flex
                style={{
                  height: 40,
                  background: 'var(--supos-uns-button-color)',
                  borderBottom: '1px solid var(--supos-t-dividr-color)',
                  borderTop: '1px solid var(--supos-t-dividr-color)',
                }}
              >
                <Flex
                  align="center"
                  style={{
                    flex: 1,
                    padding: '0 16px',
                    borderRight: '1px solid var(--supos-t-dividr-color)',
                  }}
                >
                  {/*pagePermissionChecked控制children下面所有的页面全选反选*/}
                  <ComCheckbox
                    rootStyle={{
                      '--custom-border-color': 'var(--supos-table-tr-color)',
                    }}
                    className={styles['operation-bar']}
                    label={formatMessage('common.pagePermission')}
                    checked={item.pagePermissionChecked}
                    disabled={disabled}
                    onChange={(e) => handlePagePermissionChange(item.id, e.target.checked)}
                  />
                </Flex>
                <Flex align="center" style={{ flex: 1, padding: '0 16px' }}>
                  {/*actionPermissionChecked控制children下面所有的按钮全选反选*/}
                  <ComCheckbox
                    rootStyle={{
                      '--custom-border-color': 'var(--supos-table-tr-color)',
                    }}
                    className={styles['operation-bar']}
                    label={formatMessage('common.actionPermission')}
                    checked={item.actionPermissionCheckedDisabled ? false : item.actionPermissionChecked}
                    disabled={disabled || item.actionPermissionCheckedDisabled}
                    onChange={(e) => handleActionPermissionChange(item.id, e.target.checked)}
                  />
                </Flex>
              </Flex>
              {/* 菜单和按钮 */}
              {item?.children?.map((c, index) => {
                return (
                  <Flex
                    key={c.id}
                    style={{
                      borderBottom:
                        item?.children?.length === index + 1 ? undefined : '1px solid var(--supos-t-dividr-color)',
                    }}
                  >
                    <Flex
                      style={{
                        flex: 1,
                        borderRight: '1px solid var(--supos-t-dividr-color)',
                        padding: '8px 16px',
                      }}
                    >
                      {/*控制自己的cheked*/}
                      <ComCheckbox
                        rootStyle={{
                          '--custom-border-color': 'var(--supos-table-tr-color)',
                        }}
                        label={c.menuNameKey ? formatMessage(c.menuNameKey) : c.name}
                        checked={c.checked}
                        disabled={disabled}
                        onChange={(e) => handleMenuCheckChange(c.id, e.target.checked)}
                      />
                    </Flex>
                    <Flex
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                      }}
                      wrap
                      gap={8}
                    >
                      {c?.children?.length ? (
                        c?.children?.map((cc) => {
                          return (
                            <Flex key={cc.id}>
                              {/*控制自己的cheked*/}
                              <ComCheckbox
                                disabled={disabled}
                                rootStyle={{
                                  '--custom-border-color': 'var(--supos-table-tr-color)',
                                }}
                                label={cc.menuNameKey ? formatMessage(cc.menuNameKey) : cc.name}
                                checked={cc.checked}
                                onChange={(e) => handleButtonCheckChange(cc.id, e.target.checked)}
                              />
                            </Flex>
                          );
                        })
                      ) : (
                        <div></div>
                      )}
                    </Flex>
                  </Flex>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

export default Permission;
