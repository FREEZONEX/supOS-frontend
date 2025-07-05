import { useRef, useEffect, useState, FC } from 'react';
import { Graph, Markup } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Add, ApplicationWeb, Launch, InformationFilled, CautionInverted } from '@carbon/icons-react';
import tdengine from '@/assets/home-icons/tdengine.png';
import postgresql from '@/assets/home-icons/postgresql.svg';
import nodeRed from '@/assets/home-icons/node-red.svg';
import { useNavigate } from 'react-router-dom';
import { useTranslate } from '@/hooks';
import styles from './TopologyChart.module.scss';
import { goFlow, createFlow } from '@/apis/inter-api/flow';
import { Tooltip } from 'antd';
import { getTopologyStatus } from '@/apis/inter-api/uns';
import c2 from '@/assets/uns/cw.svg';
import error from '@/assets/uns/error.svg';
import ReactDOM from 'react-dom/client'; // React 18 使用 'react-dom/client'
import { debounce } from 'lodash';
import md5 from 'blueimp-md5';
import { useDeepCompareEffect } from 'ahooks';
import classNames from 'classnames';
import { getRefreshList, getSourceList } from '@/apis/chat2db';
import timescaleDB from '@/assets/home-icons/timescaleDB.svg';
import ComFormula from '@/components/com-formula';
import ProTable from '@/components/pro-table';
import { simpleFormat, formatTimestamp } from '@/utils/format';
import { getSearchParamsString } from '@/utils/url-util';
import { useBaseStore } from '@/stores/base';

const NodeRed: FC<any> = (data) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);
  const configured = data.node.data.id || data.node.data.flowId || data.node.data.flowName;
  const statusColor = configured ? '#4CAF50' : '#B1973B';
  const formatMessage = useTranslate();
  const tooltipContent = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <InformationFilled style={{ color: 'var(--supos-theme-color)', marginRight: 4, width: 30, height: 30 }} />
          <div>
            <span style={{ color: 'var(--supos-text-color)', fontWeight: 600, fontSize: 12 }}>
              {formatMessage('common.nextStep')}:
            </span>
            <span style={{ color: 'var(--supos-text-color)', fontSize: 12 }}>
              {formatMessage('common.clickSourceFlow')}
            </span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div id={`node-red-container-${data.node.id}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {mounted && (
        <Tooltip
          title={tooltipContent()}
          open={data.node && !configured}
          placement="topRight"
          color="var(--supos-bg-color)"
          styles={{
            body: {
              position: 'relative',
              right: -100,
              backgroundColor: '#fff',
              borderRadius: 2,
              padding: 8,
            },
          }}
          getPopupContainer={() => document.getElementById(`node-red-container-${data.node.id}`) as HTMLElement}
        >
          <div
            className={classNames(styles['common-node'], styles['common-node-hover'], {
              [styles['activeBg']]: data.node.data.active,
            })}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <img src={nodeRed} alt="" width="28px" />
            <div className={styles['common-node-content']}>
              <span className={styles['common-node-subtitle']}>{formatMessage('common.nodeRed', 'Node-Red')}</span>
              <span className={styles['common-node-title']}>{formatMessage('uns.autoFlow', 'Source Flow')}</span>
            </div>
            {configured ? (
              <div className={styles['common-node-btn']} data-action="navigate">
                <Launch size={20} />
              </div>
            ) : (
              <div className={styles['common-node-btn']} data-action="navigate">
                <Add size={20} />
              </div>
            )}
            <div className={styles['status-indicator']}>
              <span className={styles['status-dot']} style={{ background: statusColor }} />
              {formatMessage(configured ? 'common.configured' : 'common.unconfigured')}
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const Mqtt = (data: any) => {
  const mqttBrokeType = useBaseStore((state) => state.mqttBrokeType);
  return (
    <div
      className={classNames(styles['common-node'], styles['common-node-hover'], {
        [styles['activeBg']]: data.node.data.active,
      })}
    >
      <div className={styles['common-node-content']}>
        <span className={styles['common-node-subtitle']}>{mqttBrokeType?.toUpperCase() || 'EMQX'}</span>
        <span className={styles['common-node-title']}>MQTT Broker </span>
      </div>
    </div>
  );
};
const TDEngine = (data: any) => {
  const { dataBaseType, systemInfo } = useBaseStore((state) => ({
    dataBaseType: state.dataBaseType,
    systemInfo: state.systemInfo,
  }));
  console.log(systemInfo?.containerMap?.chat2db);
  return (
    <div
      className={classNames(styles['common-node'], styles['common-node-hover'], {
        [styles['activeBg']]: data.node.data.active,
      })}
    >
      {data.node.data.dataType === 2 ? (
        <>
          <img src={postgresql} alt="" width="28px" />
          <div className={styles['common-node-content']}>
            <span className={styles['common-node-subtitle']}>PostgreSQL</span>
            <span className={styles['common-node-title']}>Relational DB</span>
          </div>
          {systemInfo?.containerMap?.chat2db && (
            <div className={styles['common-node-btn']} data-action="navigate">
              <Launch size={20} />
            </div>
          )}
        </>
      ) : (
        <>
          <img src={dataBaseType.includes('tdengine') ? tdengine : timescaleDB} width="28px" />
          {dataBaseType.includes('tdengine') ? (
            <div className={styles['common-node-content']}>
              <span className={styles['common-node-subtitle']}>TimescaleDB</span>
              <span className={styles['common-node-title']}>TDengine</span>
            </div>
          ) : (
            <div className={styles['common-node-content']}>
              <span className={styles['common-node-subtitle']}>TimescaleDB</span>
              <span className={styles['common-node-title']}>Database</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
const Apps = (data: any) => {
  return (
    <div
      className={classNames(styles['common-node'], styles['common-node-hover'], {
        [styles['activeBg']]: data.node.data.active,
      })}
    >
      <ApplicationWeb size={28} />
      <div className={styles['common-node-content']}>
        <span className={styles['common-node-subtitle']}>Grafana</span>
        <span className={styles['common-node-title']}>Dashboard</span>
      </div>
      <div className={styles['common-node-btn']} data-action="navigate">
        <Launch size={20} />
      </div>
    </div>
  );
};

const NodeRedTable: FC<any> = ({ flowList }) => {
  const formatMessage = useTranslate();
  return (
    <div style={{ width: '100%', display: 'contents' }}>
      {flowList && (
        <div style={{ width: '100%' }}>
          <div style={{ width: '100%', marginBottom: 12 }} className={styles['name']}>
            <CautionInverted style={{ marginRight: 8, width: 10, height: 10 }} />
            {formatMessage('uns.autoFlow', 'Source Flow')}
          </div>
          <ProTable
            bordered
            rowHoverable={false}
            className={styles.customTable}
            columns={[
              {
                title: formatMessage('uns.collectionFlowDetail'),
                dataIndex: 'label',
                key: 'label',
                width: '30%',
                render: (text: any) => <span className={styles.detailLabel}>{text}</span>,
              },
              {
                title: formatMessage('uns.content'),
                dataIndex: 'value',
                key: 'value',
                width: '70%',
                render: (value: any) => value || <span className={styles.empty}>-</span>,
              },
            ]}
            dataSource={[
              {
                key: 'flowName',
                label: formatMessage('uns.CollectionFlowName'),
                value: flowList?.flowName,
              },
              {
                key: 'template',
                label: formatMessage('uns.flowTemplate'),
                value: flowList?.template,
              },
              {
                key: 'description',
                label: formatMessage('uns.description'),
                value: flowList?.description, // 注意大小写一致性
              },
            ]}
            pagination={false}
            showHeader={true}
            rowKey="key"
          />
        </div>
      )}
    </div>
  );
};
const TdEngine1: FC<any> = ({ payload, dt = {}, instanceInfo }) => {
  // const systemInfo = useBaseStore((state) => state.systemInfo);
  console.log(instanceInfo);
  const formatMessage = useTranslate();
  // const navigate = useNavigate();
  const columns: any = [
    {
      title: formatMessage('uns.key'),
      dataIndex: 'key',
      width: '30%',
      render: (text: any) => <span className="payloadFirstTd">{text}</span>,
    },
    {
      title: formatMessage('uns.value'),
      dataIndex: 'value',
      width: '30%',
      render: (text: any) => simpleFormat(text),
    },
    {
      title: formatMessage('common.latestUpdate'),
      width: '35%',
      dataIndex: 'updateTime',
      render: (text: any) => formatTimestamp(text),
    },
  ];

  const dataSource = payload
    ? Object.keys(payload).map((key) => ({
        key,
        value: payload[key],
        updateTime: dt?.[key],
      }))
    : [];
  return (
    <>
      <ProTable
        className={styles.customTable}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="key"
        hiddenEmpty
        bordered
        rowHoverable={false}
      />
      {/*{systemInfo?.containerMap?.chat2db && instanceInfo?.dataType === 2 && instanceInfo?.alias && (*/}
      {/*  <div className={styles['btn']}>*/}
      {/*    <Button*/}
      {/*      color="default"*/}
      {/*      variant="filled"*/}
      {/*      style={{ marginTop: '10px', width: '100px' }}*/}
      {/*      icon={<Launch />}*/}
      {/*      iconPosition="end"*/}
      {/*      onClick={() => {*/}
      {/*        getSourceList().then((data: any) => {*/}
      {/*          const sourceData = data?.data?.data?.find((i: any) => i.alias === '@postgresql');*/}
      {/*          const loadData = (params: any) => {*/}
      {/*            getRefreshList(params).then((res: any) => {*/}
      {/*              if (res.hasNextPage) {*/}
      {/*                loadData({*/}
      {/*                  dataSourceId: sourceData?.id,*/}
      {/*                  pageNo: res.data?.pageNo + 1,*/}
      {/*                });*/}
      {/*              } else {*/}
      {/*                navigate(*/}
      {/*                  `/SQLEditor?dataSourceName=@postgresql&databaseName=postgres&databaseType=POSTGRESQL&schemaName=public&tableName=${instanceInfo?.alias}`*/}
      {/*                );*/}
      {/*              }*/}
      {/*            });*/}
      {/*          };*/}
      {/*          loadData({ dataSourceId: sourceData?.id });*/}
      {/*        });*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      {formatMessage('uns.sqlEditor')}*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*)}*/}
    </>
  );
};
const Mqtt1: FC<any> = () => {
  const formatMessage = useTranslate();

  const dataSource = [
    {
      key: 'front',
      detail: formatMessage('uns.front'),
      content: `ws://${window.location.hostname}:8083/mqtt`,
    },
    {
      key: 'backend',
      detail: formatMessage('uns.backend'),
      content: `tcp://${window.location.hostname}:1883/mqtt`,
    },
  ];

  const columns = [
    {
      title: formatMessage('common.detail'),
      dataIndex: 'detail',
      key: 'detail',
      width: '30%',
      render: (text: string) => <td className="payloadFirstTd">{text}</td>,
    },
    {
      title: formatMessage('uns.content'),
      dataIndex: 'content',
      width: '70%',
      key: 'content',
    },
  ];

  return (
    <ProTable
      className={styles.customTable}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      showHeader={true}
      rowKey="key"
      rowHoverable={false}
      bordered
      hiddenEmpty
    />
  );
};

const Tables: FC<any> = ({ instanceInfo }) => {
  const formatMessage = useTranslate();
  const newd: any = [];
  const newd2: any = [];
  // 用 Set 来存储已经处理过的组合（topic + field）
  const seen = new Set();
  // 去重
  const uniqueArr = instanceInfo.refers.filter((item: any) => {
    const key = `${item.topic}-${item.field}`; // 创建唯一的 key
    if (seen.has(key)) {
      return false; // 如果 key 已经存在，跳过该项
    } else {
      seen.add(key); // 否则加入 seen 集合
      return true; // 保留该项
    }
  });
  uniqueArr?.forEach((item: any, index: number) => {
    newd.push({
      label: 'Variable' + (index + 1),
      value: `"${item.topic}".${item.field}`,
    });
    newd2.push({
      label: 'Variable' + (index + 1),
      value: `${'Variable' + (index + 1)}`,
    });
  });

  // 用来存储最终的替换结果
  let resultStr = instanceInfo.expression;

  // 遍历 newd 数组，并替换对应的值
  newd.forEach((item: any) => {
    const valueRegex = new RegExp(item.value, 'g');
    resultStr = resultStr.replace(valueRegex, `${item.label}`);
  });
  const columns = [
    {
      title: formatMessage('uns.variable'),
      dataIndex: 'variable',
      width: '30%',
      render: (_: any, __: any, index: number) => formatMessage('uns.variable') + (index + 1),
    },
    {
      title: formatMessage('uns.topic'),
      dataIndex: 'topic',
      width: '40%',
      key: 'topic',
    },
    {
      title: formatMessage('uns.key'),
      dataIndex: 'field',
      width: '30%',
      key: 'field',
    },
  ];

  return (
    <div className={styles['Tables']}>
      <ComFormula fieldList={newd2} defaultOpenCalculator={false} value={resultStr} readonly={true} />
      <ProTable
        className={styles.customTable}
        columns={columns}
        dataSource={uniqueArr}
        bordered
        pagination={false}
        rowHoverable={false}
        hiddenEmpty
        rowKey={(_: any, index: any) => `row-${index}`}
      />
    </div>
  );
};

const ButtonError: FC<any> = () => {
  // nodeStatu
  return (
    // <Tooltip title={nodeStatu?.eventMessage}>
    <div className={styles['buttonError']}>
      <img src={c2} alt="cw" />
    </div>
    // </Tooltip>
  );
};
register({
  shape: 'nodeRed1',
  width: 190,
  height: 50,
  component: NodeRed,
});
register({
  shape: 'mqtt1',
  width: 150,
  height: 50,
  component: Mqtt,
});
register({
  shape: 'tdEngine1',
  width: 190,
  height: 50,
  component: TDEngine,
});
register({
  shape: 'apps1',
  width: 180,
  height: 50,
  component: Apps,
});

const commonLine = {
  sourceMarker: { name: 'circle', r: 2 },
  targetMarker: { name: 'circle', r: 2 },
  stroke: 'var(--supos-theme-color)',
  strokeDasharray: 3,
  style: {
    animation: 'ant-line 60s infinite linear',
  },
};
const markupLine = {
  markup: Markup.getForeignObjectMarkup(),
  attrs: {
    fo: {
      width: 16,
      height: 16,
      x: -10,
      y: -8,
    },
  },
};

const data = {
  nodes: [
    {
      id: 'nodeRed1',
      shape: 'nodeRed1',
      x: 250,
      y: 0,
      data: {
        topic: '',
        active: false,
        id: '',
        flowId: '',
        flowStatus: '',
        flowName: '',
      },
    },
    {
      id: 'mqtt1',
      shape: 'mqtt1',
      x: 480,
      y: 0,
      data: {
        active: false,
      },
    },
    {
      id: 'tdEngine1',
      shape: 'tdEngine1',
      x: 680,
      y: 0,
      data: {
        dataType: 1,
        active: false,
        alias: '',
      },
    },
    {
      id: 'apps1',
      shape: 'apps1',
      x: 910,
      y: 0,
      data: {
        active: false,
      },
    },
  ],
  edges: [
    {
      shape: 'edge',
      source: 'nodeRed1',
      target: 'mqtt1',
      id: 'pushMqtt',
      attrs: {
        // line 是选择器名称，选中的边的 path 元素
        line: { ...commonLine },
      },
      label: {
        position: 0,
      },
    },
    {
      shape: 'edge',
      source: 'mqtt1',
      target: 'tdEngine1',
      id: 'pullMqttOrDataPersistence', //pullMqtt从mqtt拉数据或dataPersistence数据持久化
      attrs: {
        // line 是选择器名称，选中的边的 path 元素
        line: { ...commonLine },
      },
      label: {
        position: 0,
      },
    },
    {
      shape: 'edge',
      source: 'tdEngine1',
      target: 'apps1',
      id: 'apps12',
      attrs: {
        // line 是选择器名称，选中的边的 path 元素
        line: { ...commonLine },
      },
    },
  ],
};

const TopologyChart = ({ instanceInfo, payload, dt }: any) => {
  const graphRef = useRef<any>(null);
  const dashboardType = useBaseStore((state) => state.dashboardType);
  const [active, setActive] = useState<any>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [datas, setDatas] = useState<any>({});
  const modeState = useRef<any>([]);
  const interls = useRef<any>(null);
  const orderList = ['pushOriginalData', 'pushMqtt', 'pullMqttOrDataPersistence']; //自定义循序
  const [activeInfo, setActiveInfo] = useState<any>();
  const [errorState, setErrorState] = useState<any>(false);
  const navigate = useNavigate();

  const pendingNavigationRef = useRef<any>(null);

  function findDate({ dataType, withSave2db, withDashboard }: any) {
    const _data = data;
    // _data.nodes[3].data.dataType = dataType;
    if (dataType == 3) {
      return Object.assign({}, _data, {
        nodes: _data.nodes.slice(1),
        edges: _data.edges.slice(1),
      });
    }
    if (!withSave2db) {
      return Object.assign({}, _data, {
        nodes: _data.nodes.slice(0, -2),
        edges: _data.edges.slice(0, -2),
      });
    }
    if (withSave2db && (!dashboardType?.includes('grafana') || !withDashboard)) {
      return Object.assign({}, _data, {
        nodes: _data.nodes.slice(0, -1),
        edges: _data.edges.slice(0, -1),
      });
    }
    return _data;
  }
  // 更新状态
  const updateNodeState = (edgeId: string, status = false, marked = true) => {
    if (!graphRef.current) return;
    const edge = graphRef.current.getCellById(edgeId);
    if (status) {
      edge?.attr('line/stroke', 'red'); // 更新边的颜色
      edge?.attr('line/style/animation', ''); // 清除动画
      edge?.setLabels(markupLine); //追加label
    } else {
      edge?.attr('line/stroke', 'var(--supos-theme-color)'); // 更新边的颜色
      edge?.attr('line/style/animation', 'ant-line 60s infinite linear'); // 清除动画
      edge?.setLabels({}); //追加label
    }
    // 是否去除叉叉
    if (!marked) {
      edge?.setLabels({}); //追加label
    }
  };
  const xxIndexMap = orderList.reduce((acc: any, cur: any, index: number) => {
    acc[cur] = index;
    return acc;
  }, {});
  const compareByXxOrder = (a: any, b: any) => {
    const indexA = xxIndexMap[a.topologyNode];
    const indexB = xxIndexMap[b.topologyNode];
    return indexA - indexB;
  };
  // 轮询获取拓扑图状态
  const getTopologyState = async () => {
    getTopologyStatus({
      id: instanceInfo?.id || '',
    }).then((res: any) => {
      const flag = res.filter((item: any) => item.eventCode != '0');
      if (flag.length > 0) {
        setErrorState(true);
      } else {
        setErrorState(false);
      }
      const sortedData = res.sort(compareByXxOrder);
      for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i].eventCode !== '0') {
          for (let j = i + 1; j < sortedData.length; j++) {
            sortedData[j].marked = true;
          }
          break; // 找到第一个eventCode不等于0的元素并处理后就可以退出循环了
        }
      }
      //合并pullMqtt和dataPersistence的报错信息
      const errNode = sortedData.find((e: any) => e.eventCode !== '0');
      if (errNode && ['pullMqtt', 'dataPersistence'].includes(errNode.topologyNode)) {
        sortedData.push({ ...errNode, topologyNode: 'pullMqttOrDataPersistence' });
      } else {
        sortedData.push({
          topologyNode: 'pullMqttOrDataPersistence',
          eventCode: '0',
          eventMessage: null,
          eventTime: null,
          marked: errNode ? true : false,
        });
      }
      sortedData.push({
        topologyNode: 'apps12',
        eventCode: '0',
        eventMessage: null,
        eventTime: null,
        marked: errNode ? true : false,
      });
      modeState.current = sortedData;
      data.edges.map((item: any) => {
        sortedData.map((item2: any) => {
          if (item.id === item2.topologyNode && item2.eventCode != '0' && !item2.marked) {
            updateNodeState(item.id, true, true);
            clearInterval(interls.current);
          } else if (item.id === item2.topologyNode && item2.eventCode == '0' && item2.marked) {
            updateNodeState(item.id, true, false);
          } else if (item.id === item2.topologyNode && item2.eventCode == '0' && !item2.marked) {
            updateNodeState(item.id, false, true);
          }
        });
      });
      return sortedData;
    });
  };

  const handleResize = debounce(() => {
    if (graphRef.current) {
      const ww = document.getElementsByClassName('treemapTitle')[0].clientWidth;
      const width = window.innerWidth - ww - 50; // 宽度减去侧边栏宽度
      const height = 200; // 计算容器高度
      graphRef.current.resize(width, height);
    }
  }, 200); // 防抖 200 毫秒
  // 为节点绑定点击事件
  const nodeClickFn = ({ cell, e }: any) => {
    const target = e.target as HTMLElement;
    const launchButton = target.closest('[data-action="navigate"]');

    if (cell?.id === 'nodeRed1' && launchButton) {
      if (cell.data.id || cell.data.flowId || cell.data.flowName) {
        navigate(
          `/collection-flow/flow-editor?${getSearchParamsString({
            id: cell.data.id,
            name: cell.data.flowName,
            status: cell.data.flowStatus,
            flowId: cell.data.flowId,
            from: location.pathname,
          })}`
        );
      } else {
        if (instanceInfo?.alias && instanceInfo?.path) {
          createFlow({ unsAlias: instanceInfo?.alias, path: instanceInfo?.path }).then((res: any) => {
            if (res) {
              setDatas(res || {});
              // 保存待跳转的数据
              pendingNavigationRef.current = { res };
            }
            return res;
          });
        }
      }
      return;
    }

    if (cell?.id === 'tdEngine1' && cell.data.dataType === 2 && launchButton) {
      getSourceList().then((data: any) => {
        const sourceData = data?.data?.data?.find((i: any) => i.alias === '@postgresql');
        const loadData = (params: any) => {
          getRefreshList(params).then((res: any) => {
            if (res.hasNextPage) {
              loadData({
                dataSourceId: sourceData?.id,
                pageNo: res.data?.pageNo + 1,
              });
            } else {
              navigate(
                `/SQLEditor?dataSourceName=@postgresql&databaseName=postgres&databaseType=POSTGRESQL&schemaName=public&tableName=${instanceInfo?.alias}`
              );
            }
          });
        };
        loadData({ dataSourceId: sourceData?.id });
      });
      // navigate(
      //   `/SQLEditor?dataSourceName=@postgresql&databaseName=postgres&databaseType=POSTGRESQL&schemaName=public&tableName=${cell.data.alias}`
      // );
      return;
    }
    if (cell?.id === 'apps1' && dashboardType?.includes('grafana') && launchButton) {
      navigate('/grafana-design', { state: { url: getAppsLink(instanceInfo), name: 'GrafanaDesign' } });
      return;
    }
    setActive((active: any) => (active === cell.id ? '' : cell.id));
    const node = graphRef.current.getCellById(cell.id);
    if (node.data.active) {
      // 清空所有节点的选中状态
      graphRef.current.getNodes().forEach((node: any) => {
        node.setData({
          active: false,
        });
      });
    } else {
      // 清空所有节点的选中状态
      graphRef.current.getNodes().forEach((node: any) => {
        node.setData({
          active: false,
        });
      });
      // 给节点添加选中样式
      node.setData({
        active: true,
      });
    }
  };

  // 为边绑定点击事件
  const edgeClickFn = ({ cell }: any) => {
    setActive((active: any) => (active === cell.id ? '' : cell.id));
    clearInterval(interls.current);
    // getTopologyState();
    const xx = modeState.current?.filter((item: any) => item.topologyNode == cell.id && item.eventCode != 0) || [];
    setActiveInfo(xx[0]);
    modeState.current = [];
    // interls.current = setInterval(() => {
    //   getTopologyState();
    // }, 2000);
  };

  // 更新 Topology 数据
  const fetchTopologyData = async (alias: string) => {
    try {
      const result = await goFlow(alias);
      setDatas(result || {});
    } catch (error) {
      console.error('Error fetching topology data:', error);
    }
  };
  const getAppsLink = (data: any) => {
    const { alias } = data || {};
    const aliasHash = md5(instanceInfo?.alias).slice(8, 24);
    return `/grafana/home/d/${aliasHash}/${alias.replaceAll('_', '-')}`;
  };

  // 获取并更新图表数据
  const updateGraphData = (instanceInfo: any, flowList?: any) => {
    const { nodes, edges } = findDate(instanceInfo) || { nodes: [], edges: [] };
    modeState.current = [];
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.clearCells();

        // 统计需要添加的节点和边数量
        let addCount = 0;
        const totalToAdd = nodes.length + edges.length;

        // 定义一个回调，每次添加节点或边后调用
        const handleAdded = () => {
          addCount += 1;
          if (addCount === totalToAdd) {
            // 解绑事件
            graphRef.current.off('node:added', handleAdded);
            graphRef.current.off('edge:added', handleAdded);

            if (pendingNavigationRef.current) {
              // 关键：用 requestAnimationFrame 等待一帧
              requestAnimationFrame(() => {
                // 再加一个 setTimeout 0，确保渲染
                setTimeout(() => {
                  const { res } = pendingNavigationRef.current;
                  navigate(
                    `/collection-flow/flow-editor?${getSearchParamsString({
                      id: res.id,
                      name: res.flowName,
                      flowId: res.flowId,
                      from: location.pathname,
                    })}`
                  );
                  pendingNavigationRef.current = null;
                }, 100);
              });
            }
          }
        };

        // 绑定事件
        graphRef.current.on('node:added', handleAdded);
        graphRef.current.on('edge:added', handleAdded);

        // 添加节点和边
        nodes.forEach((node) => {
          if (node.id === 'nodeRed1') {
            node.data.id = flowList?.id || '';
            node.data.flowStatus = flowList?.flowStatus || '';
            node.data.flowId = flowList?.flowId || '';
            node.data.flowName = flowList?.flowName || '';
            node.data.active = true;
            setActive('nodeRed1');
          } else if (node.id === 'tdEngine1') {
            node.data.dataType = instanceInfo?.dataType;
            node.data.alias = instanceInfo?.alias;
          }
          graphRef.current.addNode(node);
        });
        edges.forEach((edge) => {
          graphRef.current.addEdge(edge);
        });
      }
    }, 100);
  };

  // 初始化图表
  const initGraph = () => {
    if (!containerRef.current) return;
    const graphInstance: any = new Graph({
      container: containerRef.current,
      background: { color: 'var(--supos-gray-color-10-message)' },
      interacting: false,
      panning: true,
      mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] },
      scaling: { min: 0.05, max: 12 },
    });

    graphInstance.options.onEdgeLabelRendered = (args: any) => {
      const { selectors, edge } = args; // 获取edge对象
      const content = selectors.foContent as HTMLDivElement;
      if (content) {
        const root = ReactDOM.createRoot(content);
        const nodeStatu = modeState.current?.find((item: any) => item.topologyNode === edge.id);
        root.render(<ButtonError nodeStatu={nodeStatu} />); // 渲染组件
      }
    };
    graphRef.current = graphInstance;
    graphInstance.positionPoint({ x: 210, y: 0 }, 40, '40%');
    return graphInstance;
  };

  // 获取拓扑状态
  const getTopologyStateData = async () => {
    try {
      await getTopologyState();
    } catch (error) {
      console.error('Error fetching topology state:', error);
    }
  };

  useEffect(() => {
    initGraph();
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current?.clearCells();
        graphRef.current = null;
      }
    };
  }, []);

  useDeepCompareEffect(() => {
    graphRef.current?.clearCells();
    setActive('');
    fetchTopologyData(instanceInfo?.alias);
    if (!graphRef.current || !instanceInfo) return;
    // 设置轮询
    interls.current = setInterval(() => {
      getTopologyStateData();
    }, 2000);

    // 只在这里调用一次
    if (datas) {
      updateGraphData(instanceInfo, datas);
    }

    // 设置事件监听器
    graphRef.current.on('node:click', nodeClickFn);
    graphRef.current.on('edge:click', edgeClickFn);
    // 清理事件监听器
    return () => {
      if (graphRef.current) {
        graphRef.current.off('node:click', nodeClickFn);
        graphRef.current.off('edge:click', edgeClickFn);
      }
      clearInterval(interls.current);
      interls.current = null;
    };
  }, [instanceInfo, datas]);

  return (
    <div className={styles['detailTopologyWrap']}>
      <div className={styles['detailTopologyContent']} ref={containerRef} />
      {(['tdEngine1', 'mqtt1'].includes(active) || active === 'nodeRed1') && (
        <div className={styles['detailTable']}>
          {active === 'mqtt1' && instanceInfo.dataType == 3 && <Tables instanceInfo={instanceInfo} />}
          {active == 'nodeRed1' ? <NodeRedTable flowList={datas} /> : ''}
          {active == 'tdEngine1' ? <TdEngine1 payload={payload} instanceInfo={instanceInfo} dt={dt} /> : ''}
          {active == 'mqtt1' && instanceInfo.dataType != 3 ? <Mqtt1 /> : ''}
        </div>
      )}

      {errorState &&
        activeInfo?.eventMessage &&
        ['pushOriginalData', 'pushMqtt', 'pullMqttOrDataPersistence'].includes(active) && (
          <div className={styles['detailTable']} style={{ alignItems: 'center' }}>
            <div className={styles['error']}>
              <img src={error} />
              {/* <span>Your connection encountered an issue during the modeling phase.</span> */}
              <span>{activeInfo?.eventMessage}</span>
            </div>
          </div>
        )}
    </div>
  );
};

export default TopologyChart;
