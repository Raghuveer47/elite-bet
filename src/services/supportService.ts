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
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            subject,
            description,
            category
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Backend ticket created:', result);

          const ticket: SupportTicket = {
            id: result.ticket.id,
            userId: result.ticket.userId,
            subject: result.ticket.subject,
            description: result.ticket.description,
            category: result.ticket.category,
            priority: result.ticket.priority,
            status: result.ticket.status,
            messages: result.ticket.messages.map((msg: any) => ({
              id: msg._id || `msg_${Date.now()}`,
              ticketId: result.ticket.id,
              senderId: msg.senderId,
              senderType: msg.senderType,
              message: msg.message,
              sentAt: new Date(msg.sentAt)
            })),
            createdAt: new Date(result.ticket.createdAt),
            updatedAt: new Date(result.ticket.updatedAt)
          };

          // Also save to local storage for offline access
          const supportData = this.loadSupportData();
          supportData.tickets = [ticket, ...(supportData.tickets || [])];
          this.saveSupportData(supportData);

          return ticket;
        }
      } catch (error) {
        console.error('SupportService: Backend ticket creation failed:', error);
      }
    }

    // Fallback to local storage
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
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/tickets/${ticketId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId,
            senderType,
            message
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Message added to backend:', result);

          const addedMessage: SupportMessage = {
            id: result.ticket.messages[result.ticket.messages.length - 1]._id || `msg_${Date.now()}`,
            ticketId: result.ticket.id,
            senderId,
            senderType,
            message,
            sentAt: new Date(result.ticket.messages[result.ticket.messages.length - 1].sentAt)
          };

          // Also update local storage
          const supportData = this.loadSupportData();
          const ticket = supportData.tickets?.find((t: SupportTicket) => t.id === ticketId);
          if (ticket) {
            ticket.messages = [...ticket.messages, addedMessage];
            ticket.updatedAt = new Date(result.ticket.updatedAt);
            ticket.status = result.ticket.status;
            this.saveSupportData(supportData);
          }

          return addedMessage;
        }
      } catch (error) {
        console.error('SupportService: Backend message add failed:', error);
      }
    }

    // Fallback to local storage
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

  static async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/tickets/${userId}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.tickets) {
            const tickets: SupportTicket[] = result.tickets.map((ticket: any) => ({
              id: ticket.id,
              userId: ticket.userId,
              subject: ticket.subject,
              description: ticket.description,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
              assignedTo: ticket.assignedTo,
              messages: ticket.messages.map((msg: any) => ({
                id: msg._id || `msg_${Date.now()}`,
                ticketId: ticket.id,
                senderId: msg.senderId,
                senderType: msg.senderType,
                message: msg.message,
                sentAt: new Date(msg.sentAt)
              })),
              createdAt: new Date(ticket.createdAt),
              updatedAt: new Date(ticket.updatedAt),
              resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
              closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined
            }));

            // Sync to local storage
            const supportData = this.loadSupportData();
            supportData.tickets = tickets;
            this.saveSupportData(supportData);

            return tickets;
          }
        }
      } catch (error) {
        console.error('SupportService: Failed to fetch tickets from backend:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    return (supportData.tickets || []).filter((t: SupportTicket) => t.userId === userId);
  }

  static async getAllTickets(): Promise<SupportTicket[]> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/admin/tickets`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.tickets) {
            const tickets: SupportTicket[] = result.tickets.map((ticket: any) => ({
              id: ticket.id,
              userId: ticket.userId,
              subject: ticket.subject,
              description: ticket.description,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
              assignedTo: ticket.assignedTo,
              messages: ticket.messages.map((msg: any) => ({
                id: msg._id || `msg_${Date.now()}`,
                ticketId: ticket.id,
                senderId: msg.senderId,
                senderType: msg.senderType,
                message: msg.message,
                sentAt: new Date(msg.sentAt)
              })),
              createdAt: new Date(ticket.createdAt),
              updatedAt: new Date(ticket.updatedAt),
              resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
              closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined
            }));

            // Sync to local storage
            const supportData = this.loadSupportData();
            supportData.tickets = tickets;
            this.saveSupportData(supportData);

            return tickets;
          }
        }
      } catch (error) {
        console.error('SupportService: Failed to fetch all tickets from backend:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    return supportData.tickets || [];
  }

  static async updateTicketStatus(ticketId: string, status: SupportTicket['status'], assignedTo?: string): Promise<boolean> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/admin/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, assignedTo })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Ticket status updated:', result);

          // Update local storage
          const supportData = this.loadSupportData();
          const ticket = supportData.tickets?.find((t: SupportTicket) => t.id === ticketId);
          if (ticket) {
            ticket.status = status;
            if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
            ticket.updatedAt = new Date(result.ticket.updatedAt);
            if (result.ticket.resolvedAt) ticket.resolvedAt = new Date(result.ticket.resolvedAt);
            if (result.ticket.closedAt) ticket.closedAt = new Date(result.ticket.closedAt);
            this.saveSupportData(supportData);
          }

          return true;
        }
      } catch (error) {
        console.error('SupportService: Status update failed:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    const ticket = supportData.tickets?.find((t: SupportTicket) => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
      ticket.updatedAt = new Date();
      if (status === 'resolved') ticket.resolvedAt = new Date();
      if (status === 'closed') ticket.closedAt = new Date();
      this.saveSupportData(supportData);
      return true;
    }

    return false;
  }

  static async startLiveChat(userId: string): Promise<LiveChat> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/chat/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Live chat started:', result);

          const chat: LiveChat = {
            id: result.chat.id,
            userId: result.chat.userId,
            agentId: result.chat.agentId,
            status: result.chat.status,
            startedAt: new Date(result.chat.startedAt),
            messages: result.chat.messages.map((msg: any) => ({
              id: msg._id || `msg_${Date.now()}`,
              chatId: result.chat.id,
              senderId: msg.senderId,
              senderType: msg.senderType,
              message: msg.message,
              timestamp: new Date(msg.timestamp)
            }))
          };

          // Save to local storage
          const supportData = this.loadSupportData();
          supportData.chats = [chat, ...(supportData.chats || [])];
          this.saveSupportData(supportData);

          return chat;
        }
      } catch (error) {
        console.error('SupportService: Live chat start failed:', error);
      }
    }

    // Fallback to local storage
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

    // Auto-timeout after 2 minutes (show busy message)
    setTimeout(() => {
      chat.status = 'timeout';
      chat.endedAt = new Date();
      chat.messages.push({
        id: `msg_${Date.now()}`,
        chatId: chat.id,
        senderId: 'system',
        senderType: 'system',
        message: 'All agents are currently busy. Please create a support ticket for assistance.',
        timestamp: new Date()
      });
      this.saveSupportData(supportData);
    }, 2 * 60 * 1000); // 2 minutes

    return chat;
  }

  static async getUserChats(userId: string): Promise<LiveChat[]> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/chat/${userId}`);

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Loaded user chats:', result);

          const chats: LiveChat[] = result.chats.map((chat: any) => ({
            id: chat.id,
            userId: chat.userId,
            agentId: chat.agentId,
            status: chat.status,
            startedAt: new Date(chat.startedAt),
            endedAt: chat.endedAt ? new Date(chat.endedAt) : undefined,
            lastActivityAt: chat.lastActivityAt ? new Date(chat.lastActivityAt) : undefined,
            messages: chat.messages.map((msg: any) => ({
              id: msg._id || `msg_${Date.now()}`,
              chatId: chat.id,
              senderId: msg.senderId,
              senderType: msg.senderType,
              message: msg.message,
              timestamp: new Date(msg.timestamp)
            }))
          }));

          return chats;
        }
      } catch (error) {
        console.error('SupportService: Failed to load user chats:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    return (supportData.chats || []).filter((c: LiveChat) => c.userId === userId);
  }

  static async getAllLiveChats(): Promise<LiveChat[]> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/admin/chats`);

        if (response.ok) {
          const result = await response.json();
          console.log('SupportService: Loaded all chats:', result);

          const chats: LiveChat[] = result.chats.map((chat: any) => ({
            id: chat.id,
            userId: chat.userId,
            userName: chat.userName,
            agentId: chat.agentId,
            status: chat.status,
            startedAt: new Date(chat.startedAt),
            endedAt: chat.endedAt ? new Date(chat.endedAt) : undefined,
            lastActivityAt: chat.lastActivityAt ? new Date(chat.lastActivityAt) : undefined,
            messages: chat.messages.map((msg: any) => ({
              id: msg._id || `msg_${Date.now()}`,
              chatId: chat.id,
              senderId: msg.senderId,
              senderType: msg.senderType,
              message: msg.message,
              timestamp: new Date(msg.timestamp)
            }))
          }));

          return chats;
        }
      } catch (error) {
        console.error('SupportService: Failed to load all chats:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    return supportData.chats || [];
  }

  static async addChatMessage(chatId: string, senderId: string, senderType: 'user' | 'agent', message: string): Promise<void> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/chat/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId,
            senderType,
            message
          })
        });

        if (response.ok) {
          console.log('SupportService: Chat message added');
          return;
        }
      } catch (error) {
        console.error('SupportService: Failed to add chat message:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    const chat = supportData.chats?.find((c: LiveChat) => c.id === chatId);
    
    if (chat) {
      chat.messages.push({
        id: `msg_${Date.now()}`,
        chatId,
        senderId,
        senderType,
        message,
        timestamp: new Date()
      });

      if (senderType === 'agent' && chat.status === 'waiting') {
        chat.status = 'active';
        chat.agentId = senderId;
      }

      chat.lastActivityAt = new Date();
      this.saveSupportData(supportData);
    }
  }

  static async endLiveChat(chatId: string, endedBy?: string): Promise<void> {
    const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
    
    // Try backend first
    if (useBackend) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/support/chat/${chatId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endedBy })
        });

        if (response.ok) {
          console.log('SupportService: Chat ended by', endedBy);
          return;
        }
      } catch (error) {
        console.error('SupportService: Failed to end chat:', error);
      }
    }

    // Fallback to local storage
    const supportData = this.loadSupportData();
    const chat = supportData.chats?.find((c: LiveChat) => c.id === chatId);
    
    if (chat) {
      chat.status = 'ended';
      chat.endedAt = new Date();
      (chat as any).endedBy = endedBy;
      this.saveSupportData(supportData);
    }
  }
}