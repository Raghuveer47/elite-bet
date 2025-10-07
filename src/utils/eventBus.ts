/**
 * Simple Event Bus for Cross-Context Communication
 * Ensures reliable synchronization between user and admin contexts
 */

type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  // Subscribe to events
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit events
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Remove all listeners for an event
  off(event: string): void {
    this.listeners.delete(event);
  }

  // Get listener count for debugging
  getListenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();