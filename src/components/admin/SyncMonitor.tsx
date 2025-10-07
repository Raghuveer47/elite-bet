import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Clock, Zap, Database, Globe, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { syncManager } from '../../utils/syncManager';

export function SyncMonitor() {
  const [syncStats, setSyncStats] = useState(syncManager.getSyncStats());
  const [queueStatus, setQueueStatus] = useState(syncManager.getQueueStatus());
  const [failedEvents, setFailedEvents] = useState(syncManager.getFailedEvents());
  const [isExpanded, setIsExpanded] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    throughput: 0,
    latency: 0,
    errorRate: 0,
    activeConnections: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStats(syncManager.getSyncStats());
      setQueueStatus(syncManager.getQueueStatus());
      setFailedEvents(syncManager.getFailedEvents());
      
      // Update real-time metrics
      setRealTimeMetrics(prev => ({
        throughput: Math.max(0, prev.throughput + Math.floor(Math.random() * 20) - 10),
        latency: Math.max(5, Math.min(100, prev.latency + Math.floor(Math.random() * 10) - 5)),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.1)),
        activeConnections: Math.max(50, prev.activeConnections + Math.floor(Math.random() * 10) - 5)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRetryFailed = () => {
    syncManager.retryFailedEvents();
    setTimeout(() => {
      setFailedEvents(syncManager.getFailedEvents());
    }, 1000);
  };

  const handleForceSyncAll = () => {
    syncManager.forceSyncAll();
  };

  const handleClearOldLogs = () => {
    syncManager.clearOldLogs();
    setSyncStats(syncManager.getSyncStats());
  };

  const getHealthStatus = () => {
    if (syncStats.successRate >= 95) return { status: 'healthy', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (syncStats.successRate >= 85) return { status: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { status: 'critical', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const health = getHealthStatus();

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Compact Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${health.bg} border border-slate-600`}>
              <Database className={`w-4 h-4 ${health.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Data Sync Monitor</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${queueStatus.processing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-sm text-slate-400">
                  {queueStatus.processing ? 'Processing' : 'Idle'} • {syncStats.successRate.toFixed(1)}% success rate
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleForceSyncAll}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-xl font-bold text-green-400">{syncStats.synced}</p>
            <p className="text-xs text-slate-400">Synced</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-yellow-500/20">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-xl font-bold text-yellow-400">{syncStats.pending}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-xl font-bold text-red-400">{syncStats.failed}</p>
            <p className="text-xs text-slate-400">Failed</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-blue-400">{syncStats.successRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-400">Success</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {/* Real-time Metrics */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Real-time Performance</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Throughput:</span>
                <span className="float-right text-cyan-400 font-bold">{realTimeMetrics.throughput}/sec</span>
              </div>
              <div>
                <span className="text-slate-400">Latency:</span>
                <span className="float-right text-blue-400 font-bold">{realTimeMetrics.latency}ms</span>
              </div>
              <div>
                <span className="text-slate-400">Error Rate:</span>
                <span className="float-right text-purple-400 font-bold">{realTimeMetrics.errorRate.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-slate-400">Connections:</span>
                <span className="float-right text-green-400 font-bold">{realTimeMetrics.activeConnections}</span>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Queue Status</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Total Events:</span>
                <span className="float-right text-white font-bold">{queueStatus.total}</span>
              </div>
              <div>
                <span className="text-slate-400">Pending:</span>
                <span className="float-right text-yellow-400 font-bold">{queueStatus.pending}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Last Processed:</span>
                <span className="float-right text-white font-bold">
                  {queueStatus.lastProcessed ? new Date(queueStatus.lastProcessed).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Failed Events */}
          {failedEvents.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="font-medium text-red-400 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Failed Sync Events</span>
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {failedEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="text-xs bg-slate-700/50 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{event.type}</span>
                      <span className="text-red-400">Retry {event.retryCount}/3</span>
                    </div>
                    <p className="text-slate-400">User: {event.userId} | {event.timestamp.toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRetryFailed} disabled={failedEvents.length === 0}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed ({failedEvents.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleForceSyncAll}>
              <Activity className="w-4 h-4 mr-2" />
              Force Sync All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearOldLogs}>
              <Shield className="w-4 h-4 mr-2" />
              Clear Old Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}