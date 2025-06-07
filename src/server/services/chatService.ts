import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { ChatHistory, IChatHistory, IChatMessage } from '../models/ChatHistory';
import { groqAiClient, Message, TaskExtractionResult } from './groqAiService';
import config from '../config/config';
import { Task } from '../models';

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
    userId: mongoose.Types.ObjectId,
    message: string,
    chatId?: mongoose.Types.ObjectId,
    stream: boolean = false
  ): Promise<string | EventEmitter> {
    try {
      // Get or create chat history
      const chatHistory = await this.getOrCreateChatHistory(userId, chatId);
      
      // Add user message to history
      const userMessage: IChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      chatHistory.messages.push(userMessage);
      chatHistory.lastActive = new Date();
      
      // Prepare messages for AI including system prompt
      const contextMessages = this.prepareContextMessages(chatHistory.messages);
      
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
              timestamp: new Date(),
            };
            
            chatHistory.messages.push(assistantMessage);
            await chatHistory.save();
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
          timestamp: new Date(),
        };
        
        chatHistory.messages.push(assistantMessage);
        
        // Save chat history
        await chatHistory.save();
        
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
    userId: mongoose.Types.ObjectId,
    limit: number = 10
  ): Promise<IChatHistory[]> {
    return ChatHistory.find({ user: userId })
      .sort({ lastActive: -1 })
      .limit(limit)
      .lean();
  }
  
  /**
   * Get a specific chat history
   * @param chatId Chat history ID
   * @param userId User ID (for verification)
   * @returns Chat history or null if not found
   */
  public async getChatHistory(
    chatId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IChatHistory | null> {
    return ChatHistory.findOne({ _id: chatId, user: userId }).lean();
  }
  
  /**
   * Create a new chat
   * @param userId User ID
   * @returns Newly created chat history
   */
  public async createNewChat(userId: mongoose.Types.ObjectId): Promise<IChatHistory> {
    const chatHistory = new ChatHistory({
      user: userId,
      messages: [],
      title: 'New Chat',
      lastActive: new Date(),
    });
    
    await chatHistory.save();
    return chatHistory;
  }
  
  /**
   * Delete a chat history
   * @param chatId Chat history ID
   * @param userId User ID (for verification)
   * @returns Success status
   */
  public async deleteChatHistory(
    chatId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const result = await ChatHistory.deleteOne({ _id: chatId, user: userId });
    return result.deletedCount === 1;
  }
  
  /**
   * Clear all chat histories for a user
   * @param userId User ID
   * @returns Number of deleted chat histories
   */
  public async clearAllChatHistory(userId: mongoose.Types.ObjectId): Promise<number> {
    const result = await ChatHistory.deleteMany({ user: userId });
    return result.deletedCount || 0;
  }
  
  /**
   * Extract task from a user message
   * @param userId User ID
   * @param message User message text
   * @returns Task extraction result
   */
  public async extractTaskFromMessage(
    userId: mongoose.Types.ObjectId,
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
    userId: mongoose.Types.ObjectId,
    extractionResult: TaskExtractionResult
  ): Promise<mongoose.Types.ObjectId | null> {
    if (!extractionResult.success || !extractionResult.task) {
      return null;
    }
    
    const { task } = extractionResult;
    
    try {
      const newTask = new Task({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: 'pending',
        dueDate: task.dueDate || undefined,
        createdBy: userId,
        assignedTo: userId, // Assign to the creator by default
        tags: task.tags || [],
      });
      
      await newTask.save();
      return newTask._id;
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
  public async generateChatTitle(chatId: mongoose.Types.ObjectId): Promise<{success: boolean, title?: string}> {
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
      const response = await groqAiClient.chat(messages, {
        temperature: 0.7,
        max_tokens: 20
      });
      
      // Extract and clean title
      let title = response.choices[0].message.content.trim();
      
      // Remove quotes if present
      if ((title.startsWith('"') && title.endsWith('"')) || 
          (title.startsWith("'") && title.endsWith("'"))) {
        title = title.substring(1, title.length - 1);
      }
      
      // Limit length
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      // Update chat title
      chatHistory.title = title;
      await chatHistory.save();
      
      return { success: true, title };
    } catch (error) {
      console.error('Error generating chat title:', error);
      return { success: false };
    }
  }
  
  // Private helper methods
  
  /**
   * Get existing chat history or create a new one
   */
  private async getOrCreateChatHistory(
    userId: mongoose.Types.ObjectId,
    chatId?: mongoose.Types.ObjectId
  ): Promise<IChatHistory> {
    if (chatId) {
      // Try to find existing chat
      const existingChat = await ChatHistory.findOne({
        _id: chatId,
        user: userId
      });
      
      if (existingChat) {
        return existingChat;
      }
    }
    
    // Create new chat history
    return this.createNewChat(userId);
  }
  
  /**
   * Prepare messages for sending to Groq AI
   */
  private prepareContextMessages(messages: IChatMessage[]): Message[] {
    // Add system message at the beginning
    const systemMessage: Message = {
      role: 'system',
      content: config.groqAi.systemPrompt
    };
    
    // Convert chat messages to Groq API format, limiting context window
    const recentMessages = messages
      .slice(-MAX_CONTEXT_MESSAGES) // Limit to prevent context overflow
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
    
    return [systemMessage, ...recentMessages];
  }
}

// Export a singleton instance
export const chatService = new ChatService();

export default chatService; 