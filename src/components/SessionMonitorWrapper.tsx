import React from 'react';
import { useSessionMonitor } from '../hooks/useSessionMonitor';

interface SessionMonitorWrapperProps {
  children: React.ReactNode;
}

export function SessionMonitorWrapper({ children }: SessionMonitorWrapperProps) {
  useSessionMonitor();
  return <>{children}</>;
}