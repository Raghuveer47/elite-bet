import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Mail, Search, Plus, Send, Eye, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SupportService } from '../../services/supportService';
import { SupportTicket, LiveChat } from '../../types/support';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function SupportCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeChat, setActiveChat] = useState<LiveChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    category: 'account' as SupportTicket['category']
  });

  useEffect(() => {
    if (user) {
      const loadTickets = async () => {
        try {
          const userTickets = await SupportService.getUserTickets(user.id);
          setTickets(userTickets);
          
          // Update selected ticket if it exists
          if (selectedTicket) {
            const updatedTicket = userTickets.find(t => t.id === selectedTicket.id);
            if (updatedTicket) {
              setSelectedTicket(updatedTicket);
            }
          }
        } catch (error) {
          console.error('Failed to load support tickets:', error);
        }
      };
      
      loadTickets();
      
      // Auto-refresh every 10 seconds to get new admin replies
      const refreshInterval = setInterval(loadTickets, 10000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [user, selectedTicket?.id]);

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

  // Auto-refresh active chat
  useEffect(() => {
    if (activeChat && user) {
      const refreshChat = async () => {
        try {
          const chats = await SupportService.getUserChats(user.id);
          const updatedChat = chats.find(c => c.id === activeChat.id);
          if (updatedChat) {
            setActiveChat(updatedChat);
          }
        } catch (error) {
          console.error('Failed to refresh chat:', error);
        }
      };

      // Refresh every 3 seconds while chat is active
      const interval = setInterval(refreshChat, 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat?.id, user]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload to Cloudinary
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dy9zlgjh6';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      
      console.log('Uploading to Cloudinary:', { cloudName, uploadPreset });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'support_chats');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data.secure_url);
      setImagePreview(data.secure_url);
      setChatMessage(prev => prev + ` [Image: ${data.secure_url}]`);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!activeChat || !user || !chatMessage.trim()) return;

    setIsLoading(true);
    try {
      await SupportService.addChatMessage(
        activeChat.id,
        user.id,
        'user',
        chatMessage
      );

      const newMsg = {
        id: `msg_${Date.now()}`,
        chatId: activeChat.id,
        senderId: user.id,
        senderType: 'user' as const,
        message: chatMessage,
        timestamp: new Date()
      };

      setActiveChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg]
      } : null);

      setChatMessage('');
      setImagePreview(null);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    if (!activeChat || !user) return;

    setIsLoading(true);
    try {
      await SupportService.endLiveChat(activeChat.id, user.id);
      
      setActiveChat(prev => prev ? { 
        ...prev, 
        status: 'ended', 
        endedAt: new Date(),
        endedBy: user.id
      } : null);
      
      toast.success('Chat ended');
    } catch (error) {
      toast.error('Failed to end chat');
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

  const handleSendReply = async () => {
    if (!selectedTicket || !user || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const message = await SupportService.addMessage(
        selectedTicket.id,
        user.id,
        'user',
        newMessage
      );

      setSelectedTicket(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        updatedAt: new Date(),
        status: 'waiting_user'
      } : null);

      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, messages: [...ticket.messages, message], updatedAt: new Date(), status: 'waiting_user' }
          : ticket
      ));

      setNewMessage('');
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
    return true;
  });

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
            {/* Filters */}
            <div className="flex space-x-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_user">Waiting for You</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="technical">Technical</option>
                <option value="gaming">Gaming</option>
                <option value="kyc">KYC</option>
                <option value="other">Other</option>
              </select>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No support tickets yet</p>
                <Button onClick={() => setShowNewTicket(true)}>
                  Create Your First Ticket
                </Button>
              </div>
            ) : selectedTicket ? (
              // Show selected ticket chat view
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-600 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{selectedTicket.subject}</h4>
                    <p className="text-xs text-slate-400">
                      #{selectedTicket.id.slice(-8)} • {selectedTicket.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTicket(null)}
                    >
                      Back to List
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {selectedTicket.messages.map((message, idx) => (
                    <div key={message.id || idx} className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.senderType === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <div className="p-4 border-t border-slate-600">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your reply..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSendReply} 
                        disabled={!newMessage.trim() || isLoading}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {(selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') && (
                  <div className="p-4 bg-slate-600/50 text-center text-sm text-slate-300">
                    This ticket is {selectedTicket.status}. Create a new ticket if you need further assistance.
                  </div>
                )}
              </div>
            ) : (
              filteredTickets.map(ticket => (
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
                  
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Category: {ticket.category}</span>
                    <span>Created: {formatDate(ticket.createdAt)}</span>
                    <span>Messages: {ticket.messages.length}</span>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View & Reply
                  </Button>
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
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeChat.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        activeChat.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {activeChat.status.toUpperCase()}
                      </span>
                      
                      {(activeChat.status === 'waiting' || activeChat.status === 'active') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEndChat}
                          disabled={isLoading}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          End Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeChat.messages.map(message => {
                    // Check if message contains an image URL
                    const imageMatch = message.message.match(/\[Image: (https?:\/\/[^\]]+)\]/);
                    const messageText = message.message.replace(/\[Image: https?:\/\/[^\]]+\]/g, '').trim();
                    
                    return (
                      <div key={message.id} className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.senderType === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.senderType === 'system'
                            ? 'bg-slate-600 text-slate-300'
                            : 'bg-slate-600 text-white'
                        }`}>
                          {messageText && <p className="text-sm mb-2">{messageText}</p>}
                          {imageMatch && (
                            <a 
                              href={imageMatch[1]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={imageMatch[1]} 
                                alt="Uploaded screenshot" 
                                className="rounded max-w-full h-auto cursor-pointer hover:opacity-90"
                                style={{ maxHeight: '200px' }}
                              />
                            </a>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Chat Input */}
                {(activeChat.status === 'waiting' || activeChat.status === 'active') && (
                  <div className="p-4 border-t border-slate-600">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-3 relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="rounded max-h-24 border-2 border-blue-500"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                            setChatMessage(prev => prev.replace(/\[Image: https?:\/\/[^\]]+\]/g, '').trim());
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {/* Upload Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage || isLoading}
                        />
                        <div className={`p-2 rounded-lg border transition-colors ${
                          uploadingImage 
                            ? 'bg-slate-600 border-slate-500' 
                            : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                        }`}>
                          {uploadingImage ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </label>
                      
                      <Input 
                        placeholder="Type your message..." 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                        className="flex-1"
                        disabled={isLoading || uploadingImage}
                      />
                      <Button 
                        size="sm"
                        onClick={handleSendChatMessage}
                        disabled={!chatMessage.trim() || isLoading || uploadingImage}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {(activeChat.status === 'ended' || activeChat.status === 'timeout') && (
                  <div className="p-4 bg-slate-600/50 text-center text-sm text-slate-300">
                    This chat has ended. Start a new chat if you need assistance.
                  </div>
                )}
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
            
            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
              <div className="flex items-center space-x-4">
                <Mail className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="font-medium text-white mb-1">Need More Help?</h4>
                  <p className="text-sm text-slate-300 mb-2">Contact our support team directly</p>
                  <a 
                    href="mailto:support@spinzos.com" 
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    support@spinzos.com
                  </a>
                </div>
              </div>
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