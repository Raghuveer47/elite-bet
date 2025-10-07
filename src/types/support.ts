export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'account' | 'payment' | 'technical' | 'betting' | 'casino' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  sentAt: Date;
  readAt?: Date;
}

export interface LiveChat {
  id: string;
  userId: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  messages: ChatMessage[];
  rating?: number;
  feedback?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  timestamp: Date;
  readAt?: Date;
}