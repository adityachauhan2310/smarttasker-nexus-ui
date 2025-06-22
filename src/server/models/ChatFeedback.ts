import { supabase } from '../config/database';

export type FeedbackType = 'helpful' | 'not_helpful' | 'inaccurate' | 'inappropriate';

export interface IChatFeedback {
  id: string;
  user_id: string;
  chat_id: string;
  message_index: number;
  type: FeedbackType;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export class ChatFeedback {
  /**
   * Find chat feedback by ID
   */
  static async findById(id: string): Promise<IChatFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as IChatFeedback;
    } catch (error) {
      console.error('Error finding chat feedback by ID:', error);
      return null;
    }
  }

  /**
   * Create new chat feedback
   */
  static async create(feedbackData: Omit<IChatFeedback, 'id' | 'created_at' | 'updated_at'>): Promise<IChatFeedback | null> {
    try {
      // Check if feedback already exists for this message from this user
      const { data: existing } = await supabase
        .from('chat_feedback')
        .select('id')
        .eq('user_id', feedbackData.user_id)
        .eq('chat_id', feedbackData.chat_id)
        .eq('message_index', feedbackData.message_index)
        .single();
        
      if (existing) {
        // Update existing feedback instead of creating a duplicate
        return await ChatFeedback.update(existing.id, feedbackData);
      }

      const { data, error } = await supabase
        .from('chat_feedback')
        .insert(feedbackData)
        .select()
        .single();

      if (error) {
        console.error('Error creating chat feedback:', error);
        return null;
      }

      return data as IChatFeedback;
    } catch (error) {
      console.error('Error creating chat feedback:', error);
      return null;
    }
  }

  /**
   * Update chat feedback
   */
  static async update(id: string, updateData: Partial<IChatFeedback>): Promise<IChatFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat feedback:', error);
        return null;
      }

      return data as IChatFeedback;
    } catch (error) {
      console.error('Error updating chat feedback:', error);
      return null;
    }
  }

  /**
   * Delete chat feedback
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_feedback')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting chat feedback:', error);
      return false;
    }
  }

  /**
   * Get feedback for a specific chat
   */
  static async getByChatId(chatId: string): Promise<IChatFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .select('*')
        .eq('chat_id', chatId)
        .order('message_index', { ascending: true });

      if (error) {
        console.error('Error getting chat feedback:', error);
        return [];
      }

      return data as IChatFeedback[];
    } catch (error) {
      console.error('Error getting chat feedback:', error);
      return [];
    }
  }

  /**
   * Get feedback by user
   */
  static async getByUser(userId: string): Promise<IChatFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('chat_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting chat feedback by user:', error);
        return [];
      }

      return data as IChatFeedback[];
    } catch (error) {
      console.error('Error getting chat feedback by user:', error);
      return [];
    }
  }
} 