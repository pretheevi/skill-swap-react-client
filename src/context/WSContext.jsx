import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';

export const WSContext = createContext(null);

export function WSProvider({ children }) {
  const [ws, setWs] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const wsUrl = [
      `wss://insta-mirror-server.onrender.com?token=${token}`,
      `ws://localhost:8080?token=${token}`
    ]
    const socket = new WebSocket(wsUrl[0]);

    socket.onopen  = () => {
      console.log('✅ WS connected');
      setWs(socket);
    };
    socket.onerror = (e) => console.error('❌ WS error', e);
    socket.onclose = (e) => {
      console.warn('🔌 WS closed', e.code);
      setWs(null);
    };

    const ping = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(ping);
      socket.close();
    };
  }, [user]);

  return (
    <WSContext.Provider value={{ ws }}>
      {children}
    </WSContext.Provider>
  );
}