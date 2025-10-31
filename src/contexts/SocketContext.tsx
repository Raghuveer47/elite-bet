import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type CasinoSocket = {
  emit: (event: string, payload?: any) => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb?: (...args: any[]) => void) => void;
  connected: boolean;
};

interface SocketContextType {
  socket: CasinoSocket | null;
  isConnected: boolean;
  sendCoinBet: (payload: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<CasinoSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Record<string, (...args: any[]) => void>>({});

  useEffect(() => {
    const url = (import.meta.env.VITE_SOCKET_URL as string) || '';
    if (!url) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    let ioClient: any;
    let active = true;

    (async () => {
      try {
        const mod = await import('socket.io-client');
        ioClient = mod.io(`${url}/casino`, {
          transports: ['polling', 'websocket'],
          upgrade: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 500,
          path: '/socket.io'
        });

        const api: CasinoSocket = {
          emit: (e, p) => ioClient?.emit(e, p),
          on: (e, cb) => ioClient?.on(e, cb),
          off: (e, cb) => ioClient?.off(e, cb),
          get connected() { return !!ioClient?.connected; }
        } as CasinoSocket;

        if (!active) return;
        setSocket(api);

        const onConnect = () => { setIsConnected(true); console.log('[Socket] connected'); };
        const onDisconnect = () => { setIsConnected(false); console.log('[Socket] disconnected'); };
        const onError = (err: any) => { console.warn('[Socket] error', err?.message || err); };
        ioClient.on('connect', onConnect);
        ioClient.on('disconnect', onDisconnect);
        ioClient.on('connect_error', onError);
      } catch {
        setSocket(null);
        setIsConnected(false);
      }
    })();

    return () => {
      active = false;
      try {
        if (socket) {
          Object.entries(handlersRef.current).forEach(([event, cb]) => socket.off(event, cb));
        }
      } catch {}
    };
  }, []);

  const value = useMemo<SocketContextType>(() => ({
    socket,
    isConnected,
    sendCoinBet: (payload: any) => {
      try { socket?.emit('coin:placeBet', payload); } catch {}
    }
  }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useCasinoSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useCasinoSocket must be used within SocketProvider');
  return ctx;
}



