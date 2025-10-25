import { SupportTicket, SupportMessage, LiveChat, ChatMessage } from '../types/support';

export class SupportService {
  private static readonly SUPPORT_STORAGE_KEY = 'spinzos_support';

  static saveSupportData(data: any): void {
    try {
      localStorage.setItem(this.SUPPORT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save support data:', error);
    }
  }

  static loadSupportData(): any {
    try {
      const stored = localStorage.getItem(this.SUPPORT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { 
        tickets: [], 
        chats: [],
        agents: this.getDefaultAgents()
      };
    } catch (error) {
      console.error('Failed to load support data:', error);
      return { 
        tickets: [], 
        chats: [],
        agents: this.getDefaultAgents()
      };
    }
  }

  static getDefaultAgents(): any[] {
    return [
      { id: 'agent_1', name: 'Sarah Johnson', status: 'online', activeChats: 0 },
      { id: 'agent_2', name: 'Mike Chen', status: 'online', activeChats: 0 },
      { id: 'agent_3', name: 'Emma Wilson', status: 'away', activeChats: 0 }
    ];
  }

  static async createTicket(userId: string, subject: string, description: string, category: SupportTicket['category']): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      subject,
      description,
      category,
      priority: 'medium',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [{
        id: `msg_${Date.now()}`,
        ticketId: '',
        senderId: userId,
        senderType: 'user',
        message: description,
        sentAt: new Date()
      }]
    };

    ticket.messages[0].ticketId = ticket.id;

    const supportData = this.loadSupportData();
    supportData.tickets = [ticket, ...(supportData.tickets || [])];
    this.saveSupportData(supportData);

    // Trigger storage event for admin notification
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'spinzos_new_ticket',
      newValue: JSON.stringify(ticket)
    }));

    return ticket;
  }

  static async addMessage(ticketId: string, senderId: string, senderType: 'user' | 'admin', message: string): Promise<SupportMessage> {
    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      senderId,
      senderType,
      message,
      sentAt: new Date()
    };

    const supportData = this.loadSupportData();
    const ticket = supportData.tickets?.find((t: SupportTicket) => t.id === ticketId);
    
    if (ticket) {
      ticket.messages = [...ticket.messages, newMessage];
      ticket.updatedAt = new Date();
      
      if (senderType === 'admin' && ticket.status === 'waiting_user') {
        ticket.status = 'in_progress';
      } else if (senderType === 'user' && ticket.status === 'in_progress') {
        ticket.status = 'waiting_user';
      }
      
      this.saveSupportData(supportData);
    }

    return newMessage;
  }

  static getUserTickets(userId: string): SupportTicket[] {
    const supportData = this.loadSupportData();
    return (supportData.tickets || []).filter((t: SupportTicket) => t.userId === userId);
  }

  static getAllTickets(): SupportTicket[] {
    const supportData = this.loadSupportData();
    return supportData.tickets || [];
  }

  static async startLiveChat(userId: string): Promise<LiveChat> {
    const chat: LiveChat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      status: 'waiting',
      startedAt: new Date(),
      messages: [{
        id: `msg_${Date.now()}`,
        chatId: '',
        senderId: 'system',
        senderType: 'system',
        message: 'Welcome to Spinzos support. An agent will be with you shortly.',
        timestamp: new Date()
      }]
    };

    chat.messages[0].chatId = chat.id;

    const supportData = this.loadSupportData();
    supportData.chats = [chat, ...(supportData.chats || [])];
    this.saveSupportData(supportData);

    // Auto-assign to available agent after 2 seconds
    setTimeout(() => {
      const agents = supportData.agents || [];
      const availableAgent = agents.find((a: any) => a.status === 'online' && a.activeChats < 3);
      
      if (availableAgent) {
        chat.agentId = availableAgent.id;
        chat.status = 'active';
        availableAgent.activeChats++;
        
        chat.messages.push({
          id: `msg_${Date.now()}`,
          chatId: chat.id,
          senderId: availableAgent.id,
          senderType: 'agent',
          message: `Hi! I'm ${availableAgent.name}. How can I help you today?`,
          timestamp: new Date()
        });
        
        this.saveSupportData(supportData);
      }
    }, 2000);

    return chat;
  }
}