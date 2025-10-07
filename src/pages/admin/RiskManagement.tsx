import React, { useState } from 'react';
import { 
  AlertTriangle, Shield, Eye, CheckCircle, XCircle, 
  Clock, TrendingUp, Users, DollarSign, Activity
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../lib/utils';

export function RiskManagement() {
  const { 
    riskAlerts, 
    updateAlertStatus, 
    users, 
    getUserById,
    isLoading 
  } = useAdmin();
  
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredAlerts = riskAlerts.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    return matchesSeverity && matchesStatus;
  });

  const handleUpdateAlertStatus = async (alertId: string, status: any) => {
    try {
      await updateAlertStatus(alertId, status);
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-400 bg-red-500/10';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/10';
      case 'resolved': return 'text-green-400 bg-green-500/10';
      case 'false_positive': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const alertStats = [
    {
      title: 'Open Alerts',
      value: riskAlerts.filter(a => a.status === 'open').length,
      icon: AlertTriangle,
      color: 'text-red-400'
    },
    {
      title: 'Under Investigation',
      value: riskAlerts.filter(a => a.status === 'investigating').length,
      icon: Eye,
      color: 'text-yellow-400'
    },
    {
      title: 'Resolved Today',
      value: riskAlerts.filter(a => 
        a.status === 'resolved' && 
        new Date(a.createdAt).toDateString() === new Date().toDateString()
      ).length,
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'High Risk Users',
      value: users.filter(u => u.riskLevel === 'high').length,
      icon: Users,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Risk Management</h1>
          <p className="text-slate-400">Monitor and manage platform risks</p>
        </div>
        <Button variant="outline">
          <Shield className="w-4 h-4 mr-2" />
          Risk Settings
        </Button>
      </div>

      {/* Risk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {alertStats.map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-slate-400 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-slate-400">
              Showing {filteredAlerts.length} of {riskAlerts.length} alerts
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-slate-400">No risk alerts found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredAlerts.map(alert => {
              const user = getUserById(alert.userId);
              return (
                <div key={alert.id} className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-slate-300 mb-3">{alert.description}</p>
                      
                      {user && (
                        <div className="bg-slate-700 rounded-lg p-3 mb-3">
                          <h5 className="text-sm font-medium text-white mb-2">User Details</h5>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400">Name: <span className="text-white">{user.firstName} {user.lastName}</span></p>
                              <p className="text-slate-400">Email: <span className="text-white">{user.email}</span></p>
                              <p className="text-slate-400">Country: <span className="text-white">{user.country}</span></p>
                            </div>
                            <div>
                              <p className="text-slate-400">Balance: <span className="text-green-400">{formatCurrency(user.balance)}</span></p>
                              <p className="text-slate-400">Total Wagered: <span className="text-blue-400">{formatCurrency(user.totalWagered)}</span></p>
                              <p className="text-slate-400">Risk Level: <span className={user.riskLevel === 'high' ? 'text-red-400' : user.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}>{user.riskLevel}</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>Created: {formatDate(alert.createdAt)}</span>
                        {alert.amount && <span>Amount: {formatCurrency(alert.amount)}</span>}
                        {alert.assignedTo && <span>Assigned to: {alert.assignedTo}</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {alert.status === 'open' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateAlertStatus(alert.id, 'investigating')}
                            disabled={isLoading}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Investigate
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleUpdateAlertStatus(alert.id, 'resolved')}
                            disabled={isLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                      
                      {alert.status === 'investigating' && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleUpdateAlertStatus(alert.id, 'resolved')}
                            disabled={isLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateAlertStatus(alert.id, 'false_positive')}
                            disabled={isLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            False Positive
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}