import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Mail, Search, Plus, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SupportService } from '../../services/supportService';
import { SupportTicket, LiveChat } from '../../types/support';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function SupportCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeChat, setActiveChat] = useState<LiveChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    category: 'account' as SupportTicket['category']
  });

  useEffect(() => {
    if (user) {
      const userTickets = SupportService.getUserTickets(user.id);
      setTickets(userTickets);
    }
  }, [user]);

  const handleCreateTicket = async () => {
    if (!user || !newTicketData.subject.trim() || !newTicketData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const ticket = await SupportService.createTicket(
        user.id,
        newTicketData.subject,
        newTicketData.description,
        newTicketData.category
      );
      
      setTickets(prev => [ticket, ...prev]);
      setNewTicketData({ subject: '', description: '', category: 'account' });
      setShowNewTicket(false);
      toast.success('Support ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const chat = await SupportService.startLiveChat(user.id);
      setActiveChat(chat);
      setActiveTab('chat');
      toast.success('Live chat started');
    } catch (error) {
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-500/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/10';
      case 'waiting_user': return 'text-purple-400 bg-purple-500/10';
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

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold">Support Center</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleStartChat} disabled={isLoading}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tickets' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Chat
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'faq' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          FAQ
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No support tickets yet</p>
                <Button onClick={() => setShowNewTicket(true)}>
                  Create Your First Ticket
                </Button>
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">{ticket.subject}</h4>
                      <p className="text-sm text-slate-400">#{ticket.id.slice(-8)}</p>
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
                  
                  <p className="text-sm text-slate-300 mb-3">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Category: {ticket.category}</span>
                    <span>Created: {formatDate(ticket.createdAt)}</span>
                    <span>Messages: {ticket.messages.length}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4">
            {!activeChat ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Start a live chat with our support team</p>
                <Button onClick={handleStartChat} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Start Live Chat'}
                </Button>
              </div>
            ) : (
              <div className="bg-slate-700 rounded-lg h-96 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Live Support Chat</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeChat.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      activeChat.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {activeChat.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeChat.messages.map(message => (
                    <div key={message.id} className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.senderType === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.senderType === 'system'
                          ? 'bg-slate-600 text-slate-300'
                          : 'bg-slate-600 text-white'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-slate-600">
                  <div className="flex space-x-2">
                    <Input placeholder="Type your message..." className="flex-1" />
                    <Button size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search FAQ..." className="pl-10" />
            </div>
            
            {/* FAQ Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Account & Verification', count: 12 },
                { title: 'Deposits & Withdrawals', count: 18 },
                { title: 'Sports Betting', count: 15 },
                { title: 'Casino Games', count: 10 },
                { title: 'Promotions & Bonuses', count: 8 },
                { title: 'Technical Issues', count: 6 }
              ].map((category, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 cursor-pointer transition-colors">
                  <h4 className="font-medium text-white mb-1">{category.title}</h4>
                  <p className="text-sm text-slate-400">{category.count} articles</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Create Support Ticket</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={newTicketData.category}
                  onChange={(e) => setNewTicketData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="account">Account Issues</option>
                  <option value="payment">Payment Issues</option>
                  <option value="technical">Technical Problems</option>
                  <option value="betting">Betting Questions</option>
                  <option value="casino">Casino Games</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <Input
                label="Subject"
                value={newTicketData.subject}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about your issue"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowNewTicket(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTicket}
                disabled={isLoading || !newTicketData.subject.trim() || !newTicketData.description.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}