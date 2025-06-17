
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // Use Supabase edge functions URL for API calls
    const baseURL = 'https://syoqzjwyvegytdxfchil.supabase.co/functions/v1';
    
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false, // Supabase doesn't use cookies for auth
    });

    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', response.status, response.config.url, response.data);
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthToken();
          window.location.href = '/signin';
        }
        
        return Promise.reject(error);
      }
    );

    // Try to restore token from localStorage
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setAuthToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getConfig(): { baseURL: string | undefined; withCredentials: boolean } {
    return {
      baseURL: this.instance.defaults.baseURL,
      withCredentials: this.instance.defaults.withCredentials || false,
    };
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

const apiClient = new ApiClient();
export default apiClient;
