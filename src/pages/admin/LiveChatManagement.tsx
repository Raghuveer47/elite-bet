import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SupportService } from '../../services/supportService';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface LiveChat {
  id: string;
  userId: string;
  userName?: string;
  agentId: string | null;
  status: 'waiting' | 'active' | 'ended' | 'timeout';
  messages: Array<{
    id?: string;
    senderId: string;
    senderType: 'user' | 'agent' | 'system';
    message: string;
    timestamp: Date;
  }>;
  startedAt: Date;
  endedAt?: Date;
  lastActivityAt?: Date;
}

export function LiveChatManagement() {
  const [chats, setChats] = useState<LiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active'>('all');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadChats();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadChats, 5000);
    
    // Listen for new chat notifications
    const handleNewChat = (e: StorageEvent) => {
      if (e.key === 'support_data') {
        loadChats();
        toast.success('New live chat request!', {
          duration: 5000,
          icon: '💬'
        });
      }
    };

    window.addEventListener('storage', handleNewChat);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleNewChat);
    };
  }, []);

  const loadChats = async (showToast = false) => {
    try {
      const allChats = await SupportService.getAllLiveChats();
      setChats(allChats);
      
      // Update selected chat if it exists
      if (selectedChat) {
        const updated = allChats.find(c => c.id === selectedChat.id);
        if (updated) {
          setSelectedChat(updated);
        }
      }
      
      // Show notification for waiting chats
      const waitingChats = allChats.filter(c => c.status === 'waiting');
      if (waitingChats.length > 0) {
        console.log(`Admin: ${waitingChats.length} chat(s) waiting for response`);
      }
      
      if (showToast) {
        toast.success('Chats refreshed');
      }
    } catch (error) {
      console.error('Failed to load live chats:', error);
      if (showToast) {
        toast.error('Failed to refresh chats');
      }
    }
  };

  const handleManualRefresh = () => {
    loadChats(true);
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      await SupportService.addChatMessage(
        selectedChat.id,
        'admin_1',
        'agent',
        newMessage
      );

      const message = {
        id: `msg_${Date.now()}`,
        senderId: 'admin_1',
        senderType: 'agent' as const,
        message: newMessage,
        timestamp: new Date()
      };

      setSelectedChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        status: 'active',
        agentId: 'admin_1'
      } : null);

      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, messages: [...chat.messages, message], status: 'active', agentId: 'admin_1' }
          : chat
      ));

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    if (!selectedChat) return;

    setIsLoading(true);
    try {
      await SupportService.endLiveChat(selectedChat.id, 'admin_1');
      
      setSelectedChat(prev => prev ? { 
        ...prev, 
        status: 'ended', 
        endedAt: new Date(),
        endedBy: 'admin_1'
      } : null);
      
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, status: 'ended', endedAt: new Date(), endedBy: 'admin_1' }
          : chat
      ));

      toast.success('Chat ended by Admin');
    } catch (error) {
      toast.error('Failed to end chat');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: LiveChat['status']) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-500/10 animate-pulse';
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'ended': return 'text-slate-400 bg-slate-500/10';
      case 'timeout': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const filteredChats = chats.filter(chat => {
    // Hide ended/timeout chats unless "Show History" is enabled
    if (!showHistory && (chat.status === 'ended' || chat.status === 'timeout')) {
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'waiting') return chat.status === 'waiting';
    if (filter === 'active') return chat.status === 'active';
    return true;
  });

  const waitingCount = chats.filter(c => c.status === 'waiting').length;
  const activeCount = chats.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Chat Management</h2>
          <p className="text-slate-400 mt-1">Respond to user chat requests in real-time</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {waitingCount > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 animate-pulse">
              <span className="text-yellow-400 font-semibold">
                {waitingCount} chat{waitingCount > 1 ? 's' : ''} waiting for response!
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Waiting</p>
              <p className="text-2xl font-bold text-yellow-400">{waitingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Today</p>
              <p className="text-2xl font-bold text-blue-400">{chats.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({filteredChats.length})
          </Button>
          <Button
            variant={filter === 'waiting' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('waiting')}
            className={waitingCount > 0 ? 'animate-pulse' : ''}
          >
            Waiting ({waitingCount})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </Button>
        </div>
        
        <Button
          variant={showHistory ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <Clock className="w-4 h-4 mr-2" />
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
      </div>

      {/* Chat List and Chat View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-lg mb-3">Chats</h3>
          
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 bg-slate-800 rounded-lg border border-slate-700">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No chats to display</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`bg-slate-800 rounded-lg p-4 border cursor-pointer transition-all ${
                  selectedChat?.id === chat.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                } ${chat.status === 'waiting' ? 'ring-2 ring-yellow-500/50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-white">
                      {chat.userName || chat.userId.split('@')[0]}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(chat.status)}`}>
                    {chat.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mb-2">
                  Started: {formatDate(chat.startedAt)}
                </p>
                
                <p className="text-sm text-slate-300 line-clamp-1">
                  {chat.messages[chat.messages.length - 1]?.message || 'No messages yet'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2">
          {!selectedChat ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a chat to view conversation</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>{selectedChat.userName || selectedChat.userId}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Chat ID: #{selectedChat.id.slice(-8)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(selectedChat.status)}`}>
                      {selectedChat.status.toUpperCase()}
                    </span>
                    
                    {/* Refresh Chat Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleManualRefresh}
                      disabled={isLoading}
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                      title="Refresh chat messages"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    {(selectedChat.status === 'waiting' || selectedChat.status === 'active') && (
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

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {selectedChat.messages.map((message, idx) => {
                  // Check if message contains an image URL
                  const imageMatch = message.message.match(/\[Image: (https?:\/\/[^\]]+)\]/);
                  const messageText = message.message.replace(/\[Image: https?:\/\/[^\]]+\]/g, '').trim();
                  
                  return (
                    <div
                      key={message.id || idx}
                      className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.senderType === 'agent'
                            ? 'bg-blue-600 text-white'
                            : message.senderType === 'system'
                            ? 'bg-slate-600 text-slate-200 text-center mx-auto'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
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
                              alt="User screenshot" 
                              className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 border border-slate-500"
                              style={{ maxHeight: '200px' }}
                            />
                          </a>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              {(selectedChat.status === 'waiting' || selectedChat.status === 'active') && (
                <div className="p-4 border-t border-slate-700">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isLoading}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {(selectedChat.status === 'ended' || selectedChat.status === 'timeout') && (
                <div className="p-4 bg-slate-700/50 text-center text-sm text-slate-300">
                  This chat has ended
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

