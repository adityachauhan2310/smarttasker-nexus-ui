import axios from 'axios';

/**
 * API Client Configuration
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * API Error response format
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * API Client for communicating with the backend
 */
export class ApiClient {
  private instance: any; // axios instance
  private authToken: string | null = null;
  private maxRetries: number;
  private retryDelay: number;
  private refreshingToken: Promise<string | null> | null = null;
  private pendingRequests: Array<() => void> = [];
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      withCredentials: true, // Always use credentials
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Add request interceptor for auth token
    this.instance.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(this.normalizeError(error))
    );

    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Log the error for debugging
        console.error('API Error:', error.response?.status, error.response?.data || error.message);
        
        // Network errors or CORS issues
        if (error.code === 'ERR_NETWORK') {
          console.error('Network error detected - could be CORS, server down, or connection issue', {
            url: originalRequest?.url,
            method: originalRequest?.method
          });
        }
        
        // Handle token expiration and refresh
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          
          try {
            // If we're already refreshing a token, wait for that to finish
            if (this.refreshingToken) {
              const newToken = await this.refreshingToken;
              if (newToken) {
                this.setAuthToken(newToken);
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return this.instance(originalRequest);
              }
            } else {
              // Start refreshing token and track the promise
              this.refreshingToken = this.refreshToken();

              // Process the token
              const newToken = await this.refreshingToken;
              
              // Refresh completed, clear the tracking promise
              this.refreshingToken = null;
              
              if (newToken) {
                this.setAuthToken(newToken);
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                
                // Resume all pending requests
                this.pendingRequests.forEach(resolve => resolve());
                this.pendingRequests = [];
                
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            // If refresh fails, redirect to login
            this.clearAuthToken();
            console.error('Token refresh failed', refreshError);
            return Promise.reject(this.normalizeError(refreshError));
          }
        }
        
        // Handle network errors with retries
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
          }
          
          if (originalRequest._retryCount < this.maxRetries) {
            originalRequest._retryCount++;
            
            // Wait for retryDelay * (retryCount)
            const delay = this.retryDelay * originalRequest._retryCount;
            console.log(`Retrying request (attempt ${originalRequest._retryCount}) after ${delay}ms`);
            
            return new Promise(resolve => {
              setTimeout(() => resolve(this.instance(originalRequest)), delay);
            });
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Normalize error responses into a standard format
   */
  private normalizeError(error: any): ApiError {
    if (error.response) {
      // The request was made and server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors,
        code: error.response.data?.code,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 0,
        message: 'No response received from server',
        code: 'NO_RESPONSE',
      };
    } else {
      // Error in setting up the request
      return {
        status: 0,
        message: error.message || 'Request failed',
        code: 'REQUEST_FAILED',
      };
    }
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  /**
   * Try to restore auth token from localStorage
   */
  public restoreAuthToken(): boolean {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.authToken = token;
      return true;
    }
    return false;
  }

  /**
   * Refresh auth token
   */
  private async refreshToken(): Promise<string | null> {
    try {
      const response = await this.instance.post('/auth/refresh-token', {}, {
        withCredentials: true,
        headers: { 'Authorization': '' }, // Don't send current token
      });
      return response.data.token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Make a GET request
   */
  public async get<T = any>(url: string, config?: any): Promise<any> {
    return this.instance.get(url, config);
  }

  /**
   * Make a POST request
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<any> {
    try {
      console.log(`API POST request to ${this.config.baseURL}${url}`, { data });
      const response = await this.instance.post(url, data, config);
      return response;
    } catch (error) {
      console.error(`API POST error to ${url}:`, error);
      console.error('Server details:', {
        url: `${this.config.baseURL}${url}`,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  public async put<T = any>(url: string, data?: any, config?: any): Promise<any> {
    return this.instance.put(url, data, config);
  }

  /**
   * Make a PATCH request
   */
  public async patch<T = any>(url: string, data?: any, config?: any): Promise<any> {
    return this.instance.patch(url, data, config);
  }

  /**
   * Make a DELETE request
   */
  public async delete<T = any>(url: string, config?: any): Promise<any> {
    return this.instance.delete(url, config);
  }

  /**
   * Add ETag support for conditional requests
   */
  public enableEtagCaching(): void {
    const etagCache: Record<string, string> = {};

    this.instance.interceptors.request.use((config) => {
      const url = `${config.baseURL}${config.url}`;
      if (etagCache[url] && config.method?.toLowerCase() === 'get') {
        config.headers['If-None-Match'] = etagCache[url];
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => {
        const url = `${response.config.baseURL}${response.config.url}`;
        const etag = response.headers['etag'];
        if (etag) {
          etagCache[url] = etag;
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 304) {
          // Not modified, can use cached data
          return Promise.resolve({
            ...error.response,
            data: null, // Client must use cached data
            status: 304,
            statusText: 'Not Modified',
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the API client configuration
   */
  public getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

// Create a default instance with development configuration
const apiConfig: ApiClientConfig = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.smarttasker.app/api' 
    : 'http://localhost:5000/api', // Always use explicit hostname and port in dev
  withCredentials: true,
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
};

const apiClient = new ApiClient(apiConfig);
// Try to restore auth token from localStorage
apiClient.restoreAuthToken();

console.log('API Client initialized with baseURL:', apiConfig.baseURL);
// Enable etag support for improved performance
apiClient.enableEtagCaching();

export default apiClient; 