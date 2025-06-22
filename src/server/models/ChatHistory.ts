import { supabase } from '../config/database';

export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface IChatHistory {
  id: string;
  user_id: string;
  messages: IChatMessage[];
  title: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export class ChatHistory {
  /**
   * Find chat history by ID
   */
  static async findById(id: string): Promise<IChatHistory | null> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as IChatHistory;
    } catch (error) {
      console.error('Error finding chat history by ID:', error);
      return null;
    }
  }

  /**
   * Create new chat history
   */
  static async create(chatData: {
    user_id: string;
    title?: string;
    messages?: IChatMessage[];
  }): Promise<IChatHistory | null> {
    try {
      const now = new Date().toISOString();
      
      const data = {
        user_id: chatData.user_id,
        title: chatData.title || 'New Chat',
        messages: chatData.messages || [],
        last_active: now
      };

      const { data: newChat, error } = await supabase
        .from('chat_history')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating chat history:', error);
        return null;
      }

      return newChat as IChatHistory;
    } catch (error) {
      console.error('Error creating chat history:', error);
      return null;
    }
  }

  /**
   * Update chat history
   */
  static async update(id: string, updateData: Partial<IChatHistory>): Promise<IChatHistory | null> {
    try {
      // Always update last_active when updating chat
      const data = {
        ...updateData,
        last_active: new Date().toISOString()
      };
      
      const { data: updatedChat, error } = await supabase
        .from('chat_history')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat history:', error);
        return null;
      }

      return updatedChat as IChatHistory;
    } catch (error) {
      console.error('Error updating chat history:', error);
      return null;
    }
  }

  /**
   * Delete chat history
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting chat history:', error);
      return false;
    }
  }

  /**
   * Add message to chat history
   */
  static async addMessage(id: string, message: IChatMessage): Promise<IChatHistory | null> {
    try {
      // First get the current chat history
      const { data: currentChat, error: fetchError } = await supabase
        .from('chat_history')
        .select('messages')
        .eq('id', id)
        .single();
      
      if (fetchError || !currentChat) {
        console.error('Error fetching chat history to add message:', fetchError);
        return null;
      }
      
      // Add the new message to the existing messages
      const updatedMessages = [
        ...(currentChat.messages || []), 
        message
      ];
      
      // Update the chat history with new messages
      return await ChatHistory.update(id, {
        messages: updatedMessages,
        last_active: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding message to chat history:', error);
      return null;
    }
  }

  /**
   * Get chat histories by user
   */
  static async getByUser(userId: string, limit: number = 10): Promise<IChatHistory[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting chat histories by user:', error);
        return [];
      }

      return data as IChatHistory[];
    } catch (error) {
      console.error('Error getting chat histories by user:', error);
      return [];
    }
  }
} 