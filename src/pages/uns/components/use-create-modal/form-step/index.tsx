import { FC, useState, Dispatch, SetStateAction } from 'react';
import { ChevronRight, ChevronLeft } from '@carbon/icons-react';
import { Form, App, Button, Flex } from 'antd';
import { addModel, makeLabel } from '@/apis/inter-api/uns';
import { useTranslate, useFormValue } from '@/hooks';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import type { FieldItem, UnsTreeNode } from '@/pages/uns/types';
import { ROOT_NODE_ID } from '../../../store/treeStore';
import { TreeStoreActions } from '../../../store/types';
import { getTargetNode } from '@/utils/uns';
import ComPopupGuide from '@/components/com-popup-guide';

export interface FormStepProps {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  handleClose: (cb?: () => void) => void;
  isCreateFolder: boolean;
  addNamespaceForAi: { [key: string]: any };
  setAddNamespaceForAi: (e: any) => void;
  successCallBack: TreeStoreActions['loadData'];
  changeCurrentPath: (node: UnsTreeNode) => void;
  setTreeMap: TreeStoreActions['setTreeMap'];
  sourceId: string;
}

const FormStep: FC<FormStepProps> = ({
  step,
  setStep,
  handleClose,
  isCreateFolder,
  addNamespaceForAi,
  setAddNamespaceForAi,
  successCallBack,
  changeCurrentPath,
  setTreeMap,
  sourceId,
}) => {
  const { message } = App.useApp();
  const formatMessage = useTranslate();
  const form = Form.useFormInstance();
  const [loading, setLoading] = useState(false);

  //以下变量用于控制步骤按钮的显示
  const advancedOptions = useFormValue('advancedOptions', form) || false;
  const calculationType = useFormValue('calculationType', form);
  const dataType = useFormValue('dataType', form);
  const attributeType = useFormValue('attributeType', form);

  const extendToObj = (extend: { key: string; value: string }[]) => {
    if (!extend) return undefined;
    const obj: { [key: string]: string } = {};
    extend.forEach((item) => {
      obj[item.key] = item.value;
    });
    return obj;
  };

  const save = () => {
    form
      .validateFields()
      .then(async () => {
        const {
          alias,
          fields,
          dataType,
          description,
          extend,
          addFlow,
          addDashBoard,
          save2db,
          calculationType,
          refers,
          expression,
          tags,
          mainKey,
          frequency,
          referIds,
          referId,
          modelId,
          name,
          createTemplate,
          displayName,
          timeReference,

          functions,
          DataSource,
          streamOptions,
          whereCondition,
          havingCondition,
          advancedOptions,

          _advancedOptions,
          table,
        } = cloneDeep(form.getFieldsValue(true));

        // 表单验证通过后的操作
        const data: { [key: string]: any } = isCreateFolder
          ? {
              name,
              displayName,
              parentId: sourceId,
              alias,
              description,
              fields,
              pathType: 0,
              extend: extendToObj(extend),
            }
          : {
              name,
              displayName,
              parentId: sourceId,
              alias,
              dataType,
              description,
              save2db,
              pathType: 2,
              extend: extendToObj(extend),
              ...(dataType !== 6 ? { fields, addDashBoard } : {}),
            };

        if (isCreateFolder && modelId === 'custom' && fields?.length > 0) {
          data.createTemplate = createTemplate;
        }
        data.modelId = modelId && modelId !== 'custom' ? modelId : undefined;

        if (!isCreateFolder) {
          switch (dataType) {
            case 1:
            case 2:
              if (dataType === 1) {
                data.fields = fields.filter((e: FieldItem) => !e.isDefault);
              }
              data.addFlow = addFlow;
              if (dataType === 2 && mainKey > -1) {
                fields[mainKey].unique = true;
              }
              if (table?.value) {
                data.protocol = {
                  referenceDataSource: table.value
                    ?.split?.('$分隔符$')
                    ?.filter((e: string) => e !== 'tables')
                    ?.join('.'),
                };
              }
              break;
            case 3:
              if (calculationType === 3) {
                data.fields = fields.filter((e: FieldItem) => !e.isDefault);
                type ReferItemType = {
                  refer: {
                    label: string;
                    value: string;
                  };
                  field: string;
                };
                //实时计算
                data.refers = refers.map((item: ReferItemType) => {
                  return { id: item?.refer?.value, field: item.field, uts: item?.refer?.value === timeReference };
                });
                data.expression = expression ? expression.replace(/\$(.*?)#/g, '$1') : '';
              }
              if (calculationType === 4) {
                //历史计算
                data.dataType = 4;

                data.referTopic = DataSource.value;
                if (functions && Array.isArray(functions) && fields && Array.isArray(fields)) {
                  data.fields = fields.map((field: FieldItem, index: number) => {
                    const func = functions[index];
                    return {
                      ...field,
                      index: `${func.functionType}(${func.key})`,
                    };
                  });
                }

                if (whereCondition) streamOptions.whereCondition = whereCondition.replace(/\$(.*?)#/g, '$1');
                if (havingCondition) streamOptions.havingCondition = havingCondition.replace(/\$(.*?)#/g, '$1');

                if (advancedOptions && _advancedOptions) {
                  //高级流选项
                  if (_advancedOptions.trigger === 'MAX_DELAY') {
                    _advancedOptions.trigger = `MAX_DELAY ${_advancedOptions.delayTime}`;
                    delete _advancedOptions.delayTime;
                  }
                  if (_advancedOptions.startTime)
                    _advancedOptions.startTime = dayjs(_advancedOptions.startTime).format('YYYY-MM-DD');
                  if (_advancedOptions.endTime)
                    _advancedOptions.endTime = dayjs(_advancedOptions.endTime).format('YYYY-MM-DD');
                  Object.keys(_advancedOptions).forEach((key: string) => {
                    if (['', undefined, null].includes(_advancedOptions[key])) delete _advancedOptions[key];
                  });
                }
                data.streamOptions = { ...streamOptions, ..._advancedOptions };
              }
              break;
            case 6:
              Object.assign(data, {
                frequency: frequency.value + frequency.unit,
                referIds: referIds.map((e: { value: string }) => e.value),
              });
              break;
            case 7:
              Object.assign(data, {
                referIds: [referId],
                fields: undefined,
                save2db: undefined,
                addDashBoard: undefined,
              });
              break;
            default:
              break;
          }
        }

        setLoading(true);
        const handleCallback = (id: string, queryType: string) => {
          successCallBack(
            { queryType, key: sourceId ? sourceId : ROOT_NODE_ID, newNodeKey: id },
            (_, selectInfo, opt) => {
              const currentNode = getTargetNode(_ || [], id);

              changeCurrentPath(selectInfo || currentNode || { key: id, id, type: queryType === 'addFolder' ? 0 : 2 });
              setTreeMap(false);
              if (selectInfo) {
                // 非lasy树
                opt?.scrollTreeNode?.(id);
              }
            }
          );
        };
        addModel({ ...data })
          .then((res: any) => {
            message.success(formatMessage('uns.newSuccessfullyAdded'));
            if (isCreateFolder) {
              handleCallback(res, 'addFolder');
            } else {
              makeLabel(
                res,
                tags?.map(({ label, value }: { label: string; value: string | number }) => ({
                  ...(label ? { id: value } : { labelName: value }),
                })) || []
              ).then(() => {
                handleCallback(res, 'addFile');
              });
            }
            handleClose(() => setLoading(false));
          })
          .catch((err) => {
            setLoading(false);
            console.error(err);
            setAddNamespaceForAi?.(null);
          })
          .finally(() => {
            if (isCreateFolder && addNamespaceForAi) {
              // 如果是新增文件的
              setTimeout(() => {
                setAddNamespaceForAi({ ...addNamespaceForAi, currentStep: 'openFileNewModal' });
              }, 500);
            }
          });
      })
      .catch((info) => {
        console.error('校验失败:', info);
      })
      .finally(() => {
        if (addNamespaceForAi) {
          setAddNamespaceForAi?.(null);
        }
      });
  };

  const handleStep = async () => {
    return form.validateFields().then(() => {
      const next = form.getFieldValue('next');
      if (attributeType === 3 && !next) {
        message.error(formatMessage('uns.noFieldsTip'));
        return;
      }
      if (step === 2) {
        if (calculationType === 4 && advancedOptions) {
          setStep(() => step + 1);
        }
      } else {
        setStep(() => step + 1);
      }
    });
  };

  return (
    <Flex align="center" justify="flex-end" gap={10}>
      {step > 1 && (
        <Button
          color="default"
          variant="filled"
          size="small"
          style={{ color: 'var(--supos-text-color)', backgroundColor: 'var(--supos-uns-button-color)' }}
          icon={<ChevronLeft />}
          onClick={() => {
            setStep(() => step - 1);
          }}
          disabled={loading}
        >
          {formatMessage('common.prev')}
        </Button>
      )}
      {(step === 1 && [6, 7].includes(dataType)) || (step === 2 && !advancedOptions) || step === 3 || isCreateFolder ? (
        <ComPopupGuide
          key={isCreateFolder ? 'saveFolder' : 'saveFile'}
          currentStep={addNamespaceForAi?.currentStep}
          stepName={isCreateFolder ? 'saveFolder' : 'saveFile'}
          steps={addNamespaceForAi?.steps}
          placement="left"
          onFinish={() => {
            save?.();
          }}
        >
          <Button color="primary" variant="solid" size="small" onClick={save} loading={loading}>
            {formatMessage('common.save')}
          </Button>
        </ComPopupGuide>
      ) : (
        <ComPopupGuide
          stepName={`next`}
          steps={addNamespaceForAi?.steps}
          currentStep={addNamespaceForAi?.currentStep}
          onFinish={(_, nextStepName) => {
            handleStep()
              .then(() => {
                setAddNamespaceForAi({
                  ...addNamespaceForAi,
                  currentStep: nextStepName,
                });
              })
              .catch(() => {
                setAddNamespaceForAi(null);
              });
          }}
        >
          <Button
            color="default"
            variant="filled"
            size="small"
            icon={<ChevronRight />}
            iconPosition="end"
            onClick={handleStep}
          >
            {formatMessage('common.next')}
          </Button>
        </ComPopupGuide>
      )}
    </Flex>
  );
};
export default FormStep;
