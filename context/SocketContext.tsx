import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Listen for real-time updates
    socketInstance.on('work-report-created', (data) => {
      console.log('Work report created:', data);
      // You can dispatch actions or update state here
    });

    socketInstance.on('work-report-updated', (data) => {
      console.log('Work report updated:', data);
      // You can dispatch actions or update state here
    });

    socketInstance.on('work-report-deleted', (data) => {
      console.log('Work report deleted:', data);
      // You can dispatch actions or update state here
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};