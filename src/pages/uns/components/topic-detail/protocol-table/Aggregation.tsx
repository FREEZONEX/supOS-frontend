import { FC } from 'react';
import { useTranslate } from '@/hooks';

const Aggregation: FC<any> = ({ protocol, refers }) => {
  const formatMessage = useTranslate();
  return (
    <>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.frequency')}</div>
        <div>{protocol?.frequency}</div>
      </div>
      <div className="detailItem">
        <div className="detailKey">{formatMessage('uns.aggregationTarget')}</div>
        <div style={{ width: '70%', wordBreak: 'break-all' }}>{refers.map((refer: any) => refer.topic).join('，')}</div>
      </div>
    </>
  );
};
export default Aggregation;
