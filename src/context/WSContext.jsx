import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';

export const WSContext = createContext(null);

export function WSProvider({ children }) {
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // ← moved here
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const wsUrl = [
      `wss://insta-mirror-server.onrender.com?token=${token}`,
      `ws://localhost:8080?token=${token}`
    ]
    const socket = new WebSocket(wsUrl[0]);
    wsRef.current = socket;

    socket.onopen  = () => {
      console.log('✅ WS connected');
      setWs(socket);
    };
    socket.onerror = (e) => console.error('❌ WS error', e);
    socket.onclose = (e) => {
      console.warn('🔌 WS closed', e.code);
      setWs(null);
    };

    // ── handle presence at app level so it survives navigation ──
    socket.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'online_users') {
        setOnlineUsers(new Set(data.userIds.map(String)));
      }
      if (data.type === 'presence') {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (data.status === 'online') {
            updated.add(String(data.userId));
          } else {
            updated.delete(String(data.userId));
          }
          return updated;
        });
      }
    });

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
    <WSContext.Provider value={{ ws, wsRef, onlineUsers }}> {/* ← add onlineUsers */}
      {children}
    </WSContext.Provider>
  );
}