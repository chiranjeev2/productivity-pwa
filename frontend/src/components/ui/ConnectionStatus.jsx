import React from 'react';
import { useSocket } from '../../context/SocketContext';

export const ConnectionStatus = () => {
  const { isConnected } = useSocket();

  if (!isConnected) {
    return (
      <div style={{ color: '#ca8a04', background: '#fef08a', padding: '4px 12px', borderRadius: '999px', fontSize: '14px' }}>
        Reconnecting...
      </div>
    );
  }

  return (
    <div style={{ color: '#16a34a', background: '#dcfce3', padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: 'bold' }}>
      Live Sync Active
    </div>
  );
};