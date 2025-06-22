import { EventEmitter } from 'events';
import { ChatHistory, IChatHistory, IChatMessage } from '../models/ChatHistory';
import { Task } from '../models/Task';
import { groqAiClient, Message, TaskExtractionResult } from './groqAiService';

// Maximum messages to keep in conversation context
const MAX_CONTEXT_MESSAGES = 20;

/**
 * Service for handling chat interactions with Groq AI
 */
export class ChatService {
  /**
   * Send a message to the AI assistant and get a response
   * @param userId User ID for the chat
   * @param message User message text
   * @param chatId Optional chat history ID
   * @param stream Whether to stream the response
   * @returns Response or event emitter for streaming
   */
  public async sendMessage(
    userId: string,
    message: string,
    chatId?: string,
    stream: boolean = false
  ): Promise<string | EventEmitter> {
    try {
      // Get or create chat history
      const chatHistory = await this.getOrCreateChatHistory(userId, chatId);
      
      // Add user message to history
      const userMessage: IChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      // Get current messages and add new message
      const messages = [...chatHistory.messages, userMessage];
      
      // Prepare messages for AI including system prompt
      const contextMessages = this.prepareContextMessages(messages);
      
      let assistantResponse: string;
      
      if (stream) {
        // For streaming, we'll handle message history differently
        const emitter = groqAiClient.chatStream(contextMessages);
        
        // Set up a collector for the full response
        let fullResponse = '';
        
        emitter.on('chunk', (chunk) => {
          // Extract content from chunk
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
          }
        });
        
        emitter.on('end', async () => {
          // When stream ends, save the full response to chat history
          if (fullResponse) {
            const assistantMessage: IChatMessage = {
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date().toISOString(),
            };
            
            // Update chat history with both messages
            await ChatHistory.update(chatHistory.id, {
              messages: [...messages, assistantMessage],
              last_active: new Date().toISOString()
            });
          }
        });
        
        // Return the emitter for streaming to client
        return emitter;
      } else {
        // For non-streaming requests, get response then save to history
        const response = await groqAiClient.chat(contextMessages);
        assistantResponse = response.choices[0].message.content;
        
        // Add assistant response to history
        const assistantMessage: IChatMessage = {
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date().toISOString(),
        };
        
        // Update chat history with both messages
        await ChatHistory.update(chatHistory.id, {
          messages: [...messages, assistantMessage],
          last_active: new Date().toISOString()
        });
        
        return assistantResponse;
      }
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }
  
  /**
   * Get chat history for a user
   * @param userId User ID
   * @param limit Maximum number of chat histories to return
   * @returns Array of chat histories
   */
  public async getUserChatHistory(
    userId: string,
    limit: number = 10
  ): Promise<IChatHistory[]> {
    return await ChatHistory.getByUser(userId, limit);
  }
  
  /**
   * Get a specific chat history
   * @param chatId Chat history ID
   * @param userId User ID (for verification)
   * @returns Chat history or null if not found
   */
  public async getChatHistory(
    chatId: string,
    userId: string
  ): Promise<IChatHistory | null> {
    const chatHistory = await ChatHistory.findById(chatId);
    
    // Verify the chat belongs to the user
    if (!chatHistory || chatHistory.user_id !== userId) {
      return null;
    }
    
    return chatHistory;
  }
  
  /**
   * Create a new chat
   * @param userId User ID
   * @returns Newly created chat history
   */
  public async createNewChat(userId: string): Promise<IChatHistory | null> {
    return await ChatHistory.create({
      user_id: userId,
      messages: [],
      title: 'New Chat'
    });
  }
  
  /**
   * Delete a chat history
   * @param chatId Chat history ID
   * @param userId User ID (for verification)
   * @returns Success status
   */
  public async deleteChatHistory(
    chatId: string,
    userId: string
  ): Promise<boolean> {
    // First verify the chat belongs to the user
    const chatHistory = await ChatHistory.findById(chatId);
    if (!chatHistory || chatHistory.user_id !== userId) {
      return false;
    }
    
    return await ChatHistory.delete(chatId);
  }
  
  /**
   * Clear all chat histories for a user
   * @param userId User ID
   * @returns Number of deleted chat histories
   */
  public async clearAllChatHistory(userId: string): Promise<number> {
    const chatHistories = await ChatHistory.getByUser(userId, 1000);
    
    let deletedCount = 0;
    for (const chat of chatHistories) {
      const success = await ChatHistory.delete(chat.id);
      if (success) deletedCount++;
    }
    
    return deletedCount;
  }
  
  /**
   * Extract task from a user message
   * @param userId User ID
   * @param message User message text
   * @returns Task extraction result
   */
  public async extractTaskFromMessage(
    userId: string,
    message: string
  ): Promise<TaskExtractionResult> {
    return groqAiClient.extractTaskFromText(message);
  }
  
  /**
   * Create a task from extracted information
   * @param userId User ID
   * @param extractionResult Task extraction result
   * @returns Created task ID
   */
  public async createTaskFromExtraction(
    userId: string,
    extractionResult: TaskExtractionResult
  ): Promise<string | null> {
    if (!extractionResult.success || !extractionResult.task) {
      return null;
    }
    
    const { task } = extractionResult;
    
    try {
      const newTask = await Task.create({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: 'pending',
        due_date: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        created_by: userId,
        assigned_to: userId, // Assign to the creator by default
        tags: task.tags || [],
      });
      
      return newTask?.id || null;
    } catch (error) {
      console.error('Error creating task from extraction:', error);
      return null;
    }
  }
  
  /**
   * Generate a title for a chat based on its content
   * @param chatId Chat history ID
   * @returns Success status and generated title
   */
  public async generateChatTitle(chatId: string): Promise<{success: boolean, title?: string}> {
    try {
      // Get chat history
      const chatHistory = await ChatHistory.findById(chatId);
      if (!chatHistory || chatHistory.messages.length < 2) {
        return { success: false };
      }
      
      // Use the first few messages to generate a title
      const initialMessages = chatHistory.messages.slice(0, 3);
      const conversationSample = initialMessages
        .map(msg => `${msg.role}: ${msg.content.substring(0, 100)}`)
        .join('\n');
      
      // Create title generation prompt
      const messages: Message[] = [
        {
          role: 'system',
          content: 'Generate a short, descriptive title (maximum 50 characters) for this conversation based on its content.'
        },
        { role: 'user', content: conversationSample }
      ];
      
      // Get title from AI
      const response = await groqAiClient.chat(messages);
      const title = response.choices[0].message.content.trim();
      
      // Update chat history with new title
      await ChatHistory.update(chatId, { title });
      
      return {
        success: true,
        title
      };
    } catch (error) {
      console.error('Error generating chat title:', error);
      return { success: false };
    }
  }
  
  /**
   * Get or create chat history
   * @param userId User ID
   * @param chatId Optional chat history ID
   * @returns Chat history
   */
  private async getOrCreateChatHistory(
    userId: string,
    chatId?: string
  ): Promise<IChatHistory> {
    // If chat ID provided, get that specific chat
    if (chatId) {
      const existingChat = await ChatHistory.findById(chatId);
      
      // Verify the chat belongs to the user
      if (existingChat && existingChat.user_id === userId) {
        return existingChat;
      }
    }
    
    // Create a new chat
    const newChat = await this.createNewChat(userId);
    
    if (!newChat) {
      throw new Error('Failed to create chat history');
    }
    
    return newChat;
  }
  
  /**
   * Prepare context messages for the AI
   * @param messages Chat history messages
   * @returns Messages formatted for the AI
   */
  private prepareContextMessages(messages: IChatMessage[]): Message[] {
    // Add system instructions
    const contextMessages: Message[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide accurate, helpful responses.',
      },
    ];
    
    // Limit context to most recent messages (excluding system message)
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    
    // Add chat history, converting timestamps
    recentMessages.forEach((msg) => {
      contextMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });
    
    return contextMessages;
  }
}

// Export a singleton instance
export const chatService = new ChatService();

export default chatService; 