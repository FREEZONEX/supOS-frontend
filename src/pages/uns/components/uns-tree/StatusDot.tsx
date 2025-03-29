import { FC } from 'react';

const StatusDot: FC<{ status: boolean }> = ({ status }) => {
  const baseStyle = {
    width: 5,
    height: 5,
    borderRadius: '50%',
    display: 'inline-block',
    transform: 'scale(1)',
  };

  const dynamicStyle = status
    ? {
        backgroundColor: '#6FDC8C',
        animation: 'status-dot-breath 2s ease-in-out infinite',
        boxShadow: '0 0 6px rgba(111, 220, 140, 0.3)',
      }
    : {
        backgroundColor: '#ff4444',
      };

  return <div style={{ ...baseStyle, ...dynamicStyle }} />;
};

export default StatusDot;
