import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, CheckCircle, User, Send, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SupportService } from '../../services/supportService';
import { SupportTicket, SupportMessage } from '../../types/support';
import { useAdmin } from '../../contexts/AdminContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function SupportManagement() {
  const { users } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const allTickets = SupportService.getAllTickets();
    setTickets(allTickets);

    // Listen for new tickets
    const handleNewTicket = (e: StorageEvent) => {
      if (e.key === 'elitebet_new_ticket' && e.newValue) {
        try {
          const ticket = JSON.parse(e.newValue);
          setTickets(prev => [ticket, ...prev]);
        } catch (error) {
          console.error('Failed to parse new ticket:', error);
        }
      }
    };

    window.addEventListener('storage', handleNewTicket);
    return () => window.removeEventListener('storage', handleNewTicket);
  }, []);

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const message = await SupportService.addMessage(
        selectedTicket.id,
        'admin_1',
        'admin',
        newMessage
      );

      setSelectedTicket(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        updatedAt: new Date()
      } : null);

      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, messages: [...ticket.messages, message], updatedAt: new Date() }
          : ticket
      ));

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'text-red-400 bg-red-500/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/10';
      case 'waiting_user': return 'text-blue-400 bg-blue-500/10';
      case 'resolved': return 'text-green-400 bg-green-500/10';
      case 'closed': return 'text-slate-400 bg-slate-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Management</h1>
          <p className="text-slate-400">Manage customer support tickets and live chats</p>
        </div>
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-red-400">
              {tickets.filter(t => t.status === 'open').length}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Open Tickets</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">
              {tickets.filter(t => t.status === 'in_progress').length}
            </span>
          </div>
          <p className="text-slate-400 text-sm">In Progress</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">
              {tickets.filter(t => t.status === 'resolved').length}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Resolved</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <User className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">{tickets.length}</span>
          </div>
          <p className="text-slate-400 text-sm">Total Tickets</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Support Tickets</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_user">Waiting User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredTickets.map(ticket => {
                  const user = users.find(u => u.id === ticket.userId);
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                        selectedTicket?.id === ticket.id ? 'bg-slate-700' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white">{ticket.subject}</h4>
                          <p className="text-sm text-slate-400">
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-2 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>#{ticket.id.slice(-8)}</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                        <span>{ticket.messages.length} messages</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          {!selectedTicket ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a ticket to view details</p>
            </div>
          ) : (
            <div className="flex flex-col h-96">
              {/* Ticket Header */}
              <div className="p-4 border-b border-slate-700">
                <h4 className="font-medium text-white mb-1">{selectedTicket.subject}</h4>
                <p className="text-xs text-slate-400">#{selectedTicket.id.slice(-8)}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {selectedTicket.messages.map(message => (
                  <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.senderType === 'admin' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-white'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDate(message.sentAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}