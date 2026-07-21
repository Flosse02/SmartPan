import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useConfig } from './ConfigContext';

type MessageHandler = (msg: any) => void;
type ConnectHandler = () => void;

type SocketContextType = {
  connected: boolean;
  // Registers a handler for one WS message `type` (the `type` field on the
  // parsed JSON payload). Returns an unsubscribe function.
  subscribe: (type: string, handler: MessageHandler) => () => void;
  // Registers a handler to run every time the socket (re)connects — the
  // "pull anything I missed" hook used by both recipe sync and shopping
  // list sync. Returns an unsubscribe function.
  onConnect: (handler: ConnectHandler) => () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

/**
 * Owns the single shared WebSocket connection to `${config.wsUrl}/api/recipes/ws`
 * — despite the path name, this is the one socket for the whole app (recipes
 * *and* the shopping list note both broadcast over it). Consumers subscribe
 * by message type instead of each opening their own connection.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { config } = useConfig();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const connectHandlersRef = useRef<Set<ConnectHandler>>(new Set());

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
    handlersRef.current.get(type)!.add(handler);
    return () => {
      handlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  const onConnect = useCallback((handler: ConnectHandler) => {
    connectHandlersRef.current.add(handler);
    return () => {
      connectHandlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (cancelled) return;

      const url = `${config.wsUrl}/api/recipes/ws`;
      console.log('[WS] connecting to', url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] connected');
        setConnected(true);
        connectHandlersRef.current.forEach(handler => handler());
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        console.log('[WS] message', e.data);
        try {
          const msg = JSON.parse(e.data);
          handlersRef.current.get(msg.type)?.forEach(handler => handler(msg));
        } catch (err) {
          console.log('[WS] failed to parse message', err);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [config]);

  return (
    <SocketContext.Provider value={{ connected, subscribe, onConnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
