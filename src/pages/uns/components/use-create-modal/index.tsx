import { useState, useEffect, useCallback } from 'react';
import { Close } from '@carbon/icons-react';
import { Form, Drawer, Tooltip, Button } from 'antd';
import { getInstanceInfo, getModelInfo, searchTreeData, getTemplateDetail } from '@/apis/inter-api/uns';
import { parserTopicPayload } from '@/apis/inter-api/external';
import { useTranslate } from '@/hooks';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { pinyin } from 'pinyin-pro';
import FormContent from './form-content';
import FormStep from './form-step';
import './index.scss';

import type { UnsTreeNode, InitTreeDataFnType, FieldItem } from '@/pages/uns/types';
import { TreeStoreActions } from '../../store/types';
import { getExpression, parseArrayToObjects, parseTime } from '@/utils/uns';

export interface UseOptionModalProps {
  successCallBack: InitTreeDataFnType;
  addNamespaceForAi: { [key: string]: any };
  setAddNamespaceForAi: any;
  changeCurrentPath: (node?: UnsTreeNode) => void;
  setTreeMap: TreeStoreActions['setTreeMap'];
}

const extendToArr = (extend: { [key: string]: string }) => {
  if (!extend) return undefined;
  const arr: { key: string; value: string }[] = [];
  Object.keys(extend).forEach((item) => {
    arr.push({
      key: item,
      value: extend[item],
    });
  });
  return arr;
};

const useOptionModal = ({
  successCallBack,
  addNamespaceForAi,
  setAddNamespaceForAi,
  changeCurrentPath,
  setTreeMap,
}: UseOptionModalProps) => {
  const formatMessage = useTranslate();
  const [form] = Form.useForm();
  const [uuid, setUuid] = useState('');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [addModalType, setAddModalType] = useState<string>(''); //addFolder,addFile,topicToFile
  const [sourcePath, setSourcePath] = useState<string>(''); //父文件路径
  const [sourceId, setSourceId] = useState<string>(''); //父文件id

  const name = Form.useWatch('name', form) || form.getFieldValue('name');
  const modelId = Form.useWatch('modelId', form) || form.getFieldValue('modelId');

  const isCreateFolder = addModalType.includes('Folder');

  const onClose = () => {
    setOpen(false);
    form.resetFields();
    setStep(1);
    setAddNamespaceForAi?.(null);
    setSourcePath('');
    setSourceId('');
  };

  const handleMockNextStep = async (customStep: number) => {
    setStep(() => customStep);
  };

  const changeModalType = useCallback(
    async (type?: string, targetNode?: UnsTreeNode, pasteNode?: UnsTreeNode) => {
      const { id, parentId = '', path = '', parentPath = '', type: nodeType } = targetNode || {};
      const _folderPath = nodeType === 0 ? path : parentPath;
      const folderPath = _folderPath ? `${_folderPath}/` : '';
      const folderId = (nodeType === 0 ? id : parentId) || '';
      setSourcePath(folderPath);
      setSourceId(folderId as string);
      setOpen(true);
      if (pasteNode) {
        //数据回填
        const isPasteFolder = pasteNode.type === 0;
        setAddModalType(isPasteFolder ? 'pasteFolder' : 'pasteFile');
        const getInfo = isPasteFolder ? getModelInfo : getInstanceInfo;
        const detail: any = await getInfo({ id: pasteNode.id });
        if (isPasteFolder) {
          const { description, pathName: name, fields, extend, displayName } = detail || {};
          form.setFieldsValue({
            displayName,
            description,
            name,
            modelId: 'custom',
            fields,
            extend: extendToArr(extend),
          });
        } else {
          const {
            displayName,
            description,
            pathName: name,
            modelId,
            fields,
            dataType,
            protocol = {},
            labelList,
            withDashboard,
            withFlow,
            withSave2db,
            expression,
            refers,
            dataPath,
            extend,
          } = detail || {};

          const backfillForm: { [key: string]: any } = {
            displayName,
            description,
            name,
            tags: labelList
              ? labelList.map((e: { labelName: string; id: string | number }) => ({ label: e.labelName, value: e.id }))
              : [],
            addDashBoard: withDashboard,
            save2db: withSave2db,
            extend: extendToArr(extend),
            dataType,
          };

          switch (dataType) {
            case 1:
            case 2:
              Object.assign(backfillForm, {
                attributeType: modelId ? 2 : 1,
                modelId: modelId,
                addFlow: withFlow,
                mainKey: fields.findIndex((item: FieldItem) => item.unique === true),
              });
              break;
            case 3:
              type ReferType = {
                id: string;
                path: string;
                field: string;
                uts?: boolean;
              };
              //实时计算
              Object.assign(backfillForm, {
                dataType: 3,
                calculationType: 3,
                refers: refers.map((refer: ReferType) => ({
                  ...refer,
                  refer: {
                    label: refer.path,
                    value: refer.id,
                  },
                  fields: [{ name: refer.field }],
                })),
                expression: getExpression(refers, expression),
                timeReference: refers?.find((item: ReferType) => item.uts)?.id,
              });
              break;
            case 4: {
              //历史计算
              const {
                window,
                trigger = '',
                waterMark,
                deleteMark,
                fillHistory,
                ignoreUpdate,
                ignoreExpired,
                startTime,
                endTime,
              } = protocol;
              Object.assign(backfillForm, {
                dataType: 3,
                calculationType: 4,
                DataSource: { value: dataPath },
                functions: parseArrayToObjects(fields.map((field: FieldItem) => field.index)),
                whereCondition: getExpression(refers, expression, true),
                streamOptions: { window },
                advancedOptions:
                  !!trigger || !!waterMark || !!deleteMark || fillHistory || ignoreUpdate || ignoreExpired,
                _advancedOptions: {
                  trigger: trigger.split(' ')[0],
                  delayTime: trigger.split(' ')[1],
                  waterMark,
                  deleteMark,
                  fillHistory,
                  ignoreUpdate,
                  ignoreExpired,
                  startTime: startTime ? dayjs(startTime, 'YYYY-MM-DD') : undefined,
                  endTime: endTime ? dayjs(endTime, 'YYYY-MM-DD') : undefined,
                },
              });
              if (dataPath) {
                searchTreeData({ type: 3, pageNo: 1, pageSize: 99999 }).then((res: any) => {
                  const whereFieldList =
                    res
                      ?.find((e: { topic: string }) => e.topic === dataPath)
                      ?.fields?.map(({ name, type }: FieldItem) => {
                        return { label: name, value: name, type };
                      }) || [];
                  form.setFieldsValue({ whereFieldList });
                });
              }

              break;
            }
            case 6:
              Object.assign(backfillForm, {
                frequency: protocol.frequency
                  ? {
                      value: parseTime(protocol.frequency)[0],
                      unit: parseTime(protocol.frequency)[1],
                    }
                  : {},
                referIds: refers.map((item: { id: string; path: string }) => ({
                  label: item.path,
                  value: item.id,
                })),
              });
              break;
            case 7:
              Object.assign(backfillForm, {
                referId: refers?.[0].id,
              });
              break;
            default:
              break;
          }
          console.log(backfillForm, 'backfillForm');
          form.setFieldsValue(backfillForm);
          setTimeout(() => {
            form.setFieldsValue({
              fields,
            });
          }, 500);
        }
      } else {
        setAddModalType(type || '');
        const _id = nodeType === 0 ? id : nodeType === 2 ? parentId : '';
        if (type === 'topicToFile') {
          const res = await parserTopicPayload({ topic: path });
          res?.forEach?.((e: any) => {
            e.dataPath = e.dataPath || 'default';
          });
          form.setFieldsValue({
            path,
            topicName: path.split('/').pop(),
            topic: folderPath,
            fields: res?.[0]?.fields || [{}],
            modelId: undefined,
            jsonList: res,
            jsonDataPath: res?.[0]?.dataPath,
          });
          return;
        }
        if (_id) {
          const detail: any = await getModelInfo({ id: _id });
          const { fields }: { fields: FieldItem[]; modelId?: string } = detail || {};

          switch (type) {
            case 'addFolder':
              form.setFieldsValue({
                topic: folderPath,
                fields: fields,
                modelId: 'custom',
              });
              break;
            case 'addFile':
              form.setFieldsValue({
                topic: folderPath,
                fields: fields || [{}],
                attributeType: 1,
                modelId: undefined,
              });
              break;
            default:
              break;
          }
        } else {
          form.setFieldsValue(
            type?.includes('File')
              ? { fields: [{}], modelId: undefined }
              : {
                  fields: undefined,
                  modelId: 'custom',
                }
          );
        }
      }
    },
    [setSourcePath, setSourceId, setOpen, setAddModalType, form]
  );

  useEffect(() => {
    if (!open) return;
    setUuid(uuidv4().replace(/-/g, '').slice(0, 20));
  }, [open]);

  const nameChange = (val?: string) => {
    form.setFieldsValue({
      alias: `_${pinyin(val || '', { toneType: 'none' })
        ?.replace(/\s+/g, '')
        ?.replace(/-/g, '_')
        .slice(0, 38)}_${uuid}`,
      topic: `${sourcePath || ''}${val || ''}`,
    });
  };

  useEffect(() => {
    nameChange(name);
  }, [name, uuid]);

  useEffect(() => {
    if (modelId && modelId !== 'custom') {
      getTemplateDetail({ id: modelId }).then((res: any) => {
        form.setFieldValue('fields', res?.fields || []);
      });
    }
  }, [modelId]);

  const titleMap: { [key: string]: string } = {
    addFolder: formatMessage('uns.newFolder'),
    addFile: formatMessage('uns.newFile'),
    pasteFolder: formatMessage('uns.pasteFolder'),
    pasteFile: formatMessage('uns.pasteFile'),
    topicToFile: formatMessage('uns.topicToFile'),
  };

  const Dom = (
    <Drawer
      rootClassName="optionDrawerWrap"
      title={titleMap[addModalType]}
      onClose={onClose}
      open={open}
      closable={false}
      extra={
        <Tooltip title={formatMessage('common.close')}>
          <Button color="default" variant="text" onClick={onClose} icon={<Close size={20} />} />
        </Tooltip>
      }
      maskClosable={false}
      destroyOnHidden={false}
      width={680}
    >
      <div className="optionContent">
        <Form
          className="useCreateModalForm"
          name="namespaceForm"
          form={form}
          colon={false}
          style={{ position: 'relative' }}
          initialValues={{
            refers: [{}],
          }}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          labelAlign="left"
          labelWrap
        >
          <FormContent
            step={step}
            addNamespaceForAi={addNamespaceForAi}
            setAddNamespaceForAi={setAddNamespaceForAi}
            open={open}
            addModalType={addModalType}
          />
          <FormStep
            step={step}
            setStep={setStep}
            handleClose={(cb) => {
              onClose();
              cb?.();
            }}
            isCreateFolder={isCreateFolder}
            addNamespaceForAi={addNamespaceForAi}
            setAddNamespaceForAi={setAddNamespaceForAi}
            successCallBack={successCallBack as any}
            changeCurrentPath={changeCurrentPath}
            setTreeMap={setTreeMap}
            sourceId={sourceId}
            addModalType={addModalType}
          />
        </Form>
      </div>
    </Drawer>
  );
  return {
    OptionModal: Dom,
    setOptionOpen: changeModalType,
    setModalClose: onClose,
    setMockNextStep: handleMockNextStep,
  };
};
export default useOptionModal;
