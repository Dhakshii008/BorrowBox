import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api/client.js';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const handlersRef = useRef([]);

  const onNotification = useCallback((handler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const token = getToken();
    const client = io('/', { auth: { token }, transports: ['websocket'] });

    client.on('connect', () => {});
    client.on('notification', (payload) => {
      setUnreadCount((prev) => prev + 1);
      const titles = {
        borrow_request: 'New borrow request',
        request_accepted: 'Request accepted',
        request_declined: 'Request declined',
        return_requested: 'Return requested',
        return_confirmed: 'Return confirmed',
        review_received: 'New review received',
      };
      const title = titles[payload?.type] || payload?.title || 'Notification';
      toast.info(payload?.message || title);
      handlersRef.current.forEach((handler) => handler(payload));
    });
    client.on('connect_error', () => {});

    setSocket(client);

    apiGetUnread();

    return () => {
      client.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id]);

  const apiGetUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=1');
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      /* noop */
    }
  }, []);

  const refreshUnread = useCallback(() => {
    apiGetUnread();
  }, [apiGetUnread]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, onNotification, refreshUnread }}>
      {children}
    </SocketContext.Provider>
  );
}