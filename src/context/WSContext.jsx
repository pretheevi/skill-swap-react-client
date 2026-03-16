import { createContext, useContext, useEffect, useRef, useState, useCallback, useReducer } from 'react';
import { AuthContext } from './AuthContext';
import { initialState, chatReducer } from './chatContext';

export const WSContext = createContext(null);

export function WSProvider({ children }) {
  const [ws, setWs] = useState(null);
  const { user } = useContext(AuthContext);
  const [ state, dispatch ] = useReducer(chatReducer, initialState);

  const messageHandlerRef = useRef(null);

  // expose this so Chat.jsx can register its handler
  const registerMessageHandler = useCallback((cb) => {
    messageHandlerRef.current = cb;
  }, []);

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

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      // presence handled here — always active, regardless of what's mounted
      if (parsed.type === 'presence') {
        dispatch({
          type: parsed.isOnline ? 'USER_ONLINE' : 'USER_OFFLINE',
          payload: parsed.userId
        });
        return;
      }

      // forward chat messages to Chat.jsx if it's mounted
      if (messageHandlerRef.current) {
        messageHandlerRef.current(parsed);
      }
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
    <WSContext.Provider value={{ ws, onlineUsers: state.onlineUsers, registerMessageHandler }}>
      {children}
    </WSContext.Provider>
  );
}