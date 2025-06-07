import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/config';
import { EventEmitter } from 'events';

// Define TypeScript interfaces for Groq API requests and responses
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GroqChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqChatStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: null | string;
  }[];
}

export interface TaskExtractionResult {
  success: boolean;
  task?: {
    title: string;
    description?: string;
    dueDate?: Date | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
  };
  confidence: number;
  error?: string;
  rawResponse?: any;
}

// Error class for Groq API errors
export class GroqApiError extends Error {
  statusCode: number;
  errorType: string;
  
  constructor(message: string, statusCode: number, errorType: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.name = 'GroqApiError';
  }
}

// Create a class for the Groq AI client
class GroqAiClient {
  private apiClient: AxiosInstance;
  private defaultModel: string;
  private maxRetries: number;
  private retryDelay: number;
  
  constructor() {
    // Initialize Axios client with base configuration
    this.apiClient = axios.create({
      baseURL: config.groqAi.apiUrl,
      timeout: config.groqAi.timeoutMs,
      headers: {
        'Authorization': `Bearer ${config.groqAi.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    this.defaultModel = config.groqAi.model;
    this.maxRetries = config.groqAi.retries;
    this.retryDelay = config.groqAi.retryDelay;
    
    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      async error => {
        // Log error details
        console.error('Groq API error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        
        // Transform error into a more friendly format
        if (error.response) {
          const { status, data } = error.response;
          const errorType = data?.error?.type || 'api_error';
          const message = data?.error?.message || 'Unknown API error';
          
          throw new GroqApiError(message, status, errorType);
        }
        
        // Network errors, timeouts, etc.
        throw error;
      }
    );
  }
  
  /**
   * Make a request to the Groq Chat API with retry logic
   * @param messages Array of messages for the conversation
   * @param params Optional parameters for the model
   * @returns Promise with the Groq API response
   */
  public async chat(
    messages: Message[],
    params: GroqModelParams = {}
  ): Promise<GroqChatResponse> {
    // Prepare the request payload
    const payload: GroqChatRequest = {
      model: this.defaultModel,
      messages,
      temperature: params.temperature ?? config.groqAi.temperature,
      top_p: params.top_p ?? config.groqAi.topP,
      max_tokens: params.max_tokens ?? config.groqAi.maxTokens,
      stream: false, // For non-streaming requests
    };
    
    // Initialize retry counter
    let retries = 0;
    
    while (true) {
      try {
        // Make the API call
        const response = await this.apiClient.post<GroqChatResponse>(
          '/chat/completions',
          payload
        );
        
        // Return successful response
        return response.data;
      } catch (error) {
        // Don't retry if we've hit the maximum retry count
        if (retries >= this.maxRetries) {
          throw error;
        }
        
        // Only retry on certain error types
        if (error instanceof GroqApiError) {
          // Rate limit errors or server errors should be retried
          if (error.statusCode === 429 || (error.statusCode >= 500 && error.statusCode < 600)) {
            retries++;
            
            // Wait before retrying with exponential backoff
            const delay = this.retryDelay * Math.pow(2, retries - 1);
            console.log(`Retrying Groq API request (${retries}/${this.maxRetries}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other error types, just throw
        throw error;
      }
    }
  }
  
  /**
   * Create a streaming request to the Groq Chat API
   * @param messages Array of messages for the conversation
   * @param params Optional parameters for the model
   * @returns EventEmitter that emits chunks of the response
   */
  public chatStream(
    messages: Message[],
    params: GroqModelParams = {}
  ): EventEmitter {
    const emitter = new EventEmitter();
    
    // Prepare the request payload
    const payload: GroqChatRequest = {
      model: this.defaultModel,
      messages,
      temperature: params.temperature ?? config.groqAi.temperature,
      top_p: params.top_p ?? config.groqAi.topP,
      max_tokens: params.max_tokens ?? config.groqAi.maxTokens,
      stream: true, // Streaming is required here
    };
    
    // Make the streaming request
    const requestConfig: AxiosRequestConfig = {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
      },
    };
    
    // Process the streaming response
    this.apiClient.post('/chat/completions', payload, requestConfig)
      .then(response => {
        const stream = response.data;
        
        let buffer = '';
        
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              // Check for the end of the stream
              if (data === '[DONE]') {
                emitter.emit('done');
                return;
              }
              
              try {
                // Parse the JSON chunk
                const chunk: GroqChatStreamChunk = JSON.parse(data);
                emitter.emit('chunk', chunk);
              } catch (error) {
                console.error('Error parsing SSE chunk:', error);
              }
            }
          }
        });
        
        stream.on('end', () => {
          emitter.emit('end');
        });
        
        stream.on('error', (error: Error) => {
          emitter.emit('error', error);
        });
      })
      .catch(error => {
        emitter.emit('error', error);
      });
    
    return emitter;
  }
  
  /**
   * Extract task information from natural language
   * @param userMessage The user's message containing task details
   * @returns Promise with extracted task information
   */
  public async extractTaskFromText(userMessage: string): Promise<TaskExtractionResult> {
    try {
      // Create a specialized system prompt for task extraction
      const systemPrompt = `
You are an AI task extraction system. Your job is to analyze text and extract task information.
Extract the following fields if present:
- title (required): A concise task title
- description: Additional details about the task
- dueDate: When the task is due (extract as ISO date string)
- priority: The priority level (low, medium, high, urgent)
- tags: Relevant tags for the task (array of strings)

Provide a confidence score between 0-1 indicating how confident you are in the extraction.
Format output as valid JSON.
`;
      
      // Create extraction prompt
      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract task information from this text: "${userMessage}"` }
      ];
      
      // Make the API call with higher precision settings
      const response = await this.chat(messages, {
        temperature: 0.2, // Lower temperature for more deterministic output
        max_tokens: 500,  // Smaller limit for extraction
      });
      
      // Parse the response
      const content = response.choices[0].message.content;
      let extractedData;
      
      try {
        extractedData = JSON.parse(content);
      } catch (error) {
        return {
          success: false,
          confidence: 0,
          error: 'Failed to parse task extraction response',
        };
      }
      
      // Validate the extracted data
      if (!extractedData.title) {
        return {
          success: false,
          confidence: extractedData.confidence || 0,
          error: 'Failed to extract required task title',
          rawResponse: extractedData,
        };
      }
      
      // Process the due date if present
      let dueDate = null;
      if (extractedData.dueDate) {
        try {
          dueDate = new Date(extractedData.dueDate);
          // Check if date is valid
          if (isNaN(dueDate.getTime())) {
            dueDate = null;
          }
        } catch (error) {
          dueDate = null;
        }
      }
      
      // Return the successful extraction
      return {
        success: true,
        task: {
          title: extractedData.title,
          description: extractedData.description,
          dueDate,
          priority: extractedData.priority,
          tags: Array.isArray(extractedData.tags) ? extractedData.tags : undefined,
        },
        confidence: extractedData.confidence || 0.5,
        rawResponse: extractedData,
      };
    } catch (error) {
      console.error('Task extraction error:', error);
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error during task extraction',
      };
    }
  }
}

// Export a singleton instance
export const groqAiClient = new GroqAiClient();

export default groqAiClient; 