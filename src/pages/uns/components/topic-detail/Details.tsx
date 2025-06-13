import { FC } from 'react';
import { History, Aggregation } from './protocol-table';
import { useTranslate, useClipboard } from '@/hooks';
import { Tag } from 'antd';
import { Copy } from '@carbon/icons-react';
import { formatTimestamp } from '@/utils/format';

interface DetailsProps {
  instanceInfo: { [key: string]: any };
  updateTime?: number;
}

const Details: FC<DetailsProps> = ({ instanceInfo, updateTime }) => {
  const formatMessage = useTranslate();
  const { copy } = useClipboard();

  const dataTypeMap: { [key: number]: string } = {
    1: formatMessage('uns.timeSeries'),
    2: formatMessage('uns.relational'),
    3: formatMessage('uns.realtimeCalculation'),
    4: formatMessage('uns.historicalCalculation'),
    6: formatMessage('uns.aggregation'),
    7: formatMessage('uns.reference'),
  };
  const renderProtocolTable = (protocol: { [key: string]: any }) => {
    if (instanceInfo.dataType === 4) return <History protocol={protocol} dataPath={instanceInfo.dataPath} />;
    if (instanceInfo.dataType === 6) return <Aggregation protocol={protocol} refers={instanceInfo.refers || []} />;
    return null;
  };
  return (
    <>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.topic')}</div>
        <div>
          {instanceInfo.topic}
          <span
            style={{ marginLeft: '5px', verticalAlign: 'sub', cursor: 'pointer' }}
            onClick={() => copy(instanceInfo.topic)}
            title={formatMessage('common.copy')}
          >
            <Copy />
          </span>
        </div>
      </div>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.alias')}</div>
        <div>
          {instanceInfo.alias}
          <span
            style={{ marginLeft: '5px', verticalAlign: 'sub', cursor: 'pointer' }}
            onClick={() => copy(instanceInfo.alias)}
            title={formatMessage('common.copy')}
          >
            <Copy />
          </span>
        </div>
      </div>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.displayName')}</div>
        <div>{instanceInfo.displayName}</div>
      </div>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.description')}</div>
        <div>{instanceInfo.description}</div>
      </div>
      {[1, 2].includes(instanceInfo.dataType) && (
        <div className="detailItem">
          <div className="detailKey">
            {formatMessage(
              instanceInfo?.protocol?.referenceDataSource ? 'uns.referenceDataSource' : 'uns.referenceTemplate'
            )}
          </div>
          <div>
            {instanceInfo?.protocol?.referenceDataSource ||
              (instanceInfo.modelName ? `${instanceInfo.modelName}（${instanceInfo.templateAlias}）` : '')}
          </div>
        </div>
      )}
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.databaseType')}</div>
        <div>{dataTypeMap[instanceInfo.dataType]}</div>
      </div>
      {![6, 7].includes(instanceInfo.dataType) && (
        <div className="detailItem">
          <div className="detailKey">{formatMessage('common.label')}</div>
          <div>
            {instanceInfo.labelList &&
              instanceInfo.labelList.map((tag: { labelName: string }, index: number) => {
                return (
                  <Tag key={index} style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                    {tag.labelName}
                  </Tag>
                );
              })}
          </div>
        </div>
      )}
      {instanceInfo.dataType !== 7 && (
        <div className="detailItem">
          <div className="detailKey">{formatMessage('uns.persistence')}</div>
          <div>{formatMessage(instanceInfo.withSave2db ? 'uns.true' : 'uns.false')}</div>
        </div>
      )}
      {instanceInfo.protocol && renderProtocolTable(instanceInfo.protocol)}
      {instanceInfo.showExpression && (
        <>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('common.expression')}</div>
            <div>{instanceInfo.showExpression.replace(/\$(.*?)#/g, '$1')}</div>
          </div>
          <div className="detailItem">
            <div className="detailKey">{formatMessage('uns.reference')}</div>
            <div>{instanceInfo?.refers?.find((e: { uts: boolean }) => e.uts)?.path}</div>
          </div>
        </>
      )}
      <div className="detailItem">
        <div className="detailKey">{formatMessage('common.creationTime')}</div>
        <div>{formatTimestamp(instanceInfo.createTime)}</div>
      </div>
      {instanceInfo.dataType === 7 && (
        <div className="detailItem">
          <div className="detailKey">{formatMessage('uns.referenceTarget')}</div>
          <div>{instanceInfo?.refers?.[0]?.path}</div>
        </div>
      )}
      {![3, 4].includes(instanceInfo.dataType) && (
        <div className="detailItem">
          <div className="detailKey">{formatMessage('common.latestUpdate')}</div>
          {updateTime && <div>{formatTimestamp(updateTime)}</div>}
        </div>
      )}
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.namespace')}</div>
        <div>{instanceInfo.path}</div>
      </div>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.originalName')}</div>
        <div>{instanceInfo.name}</div>
      </div>
      {instanceInfo.extend &&
        Object.keys(instanceInfo.extend).map((item: string, index: number) => (
          <div className="detailItem" key={index}>
            <div className="detailKey">{item}</div>
            <div>
              {instanceInfo.extend[item]}
              <Tag style={{ marginLeft: '8px' }}>{formatMessage('uns.expandedInformation')}</Tag>
            </div>
          </div>
        ))}
    </>
  );
};
export default Details;
