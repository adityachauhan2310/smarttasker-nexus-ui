
import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

class ApiClient {
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
    console.log('API Request:', 'GET', endpoint, params);
    
    // Handle different API endpoints
    if (endpoint === '/users') {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range((params?.page - 1) * (params?.limit || 10), params?.page * (params?.limit || 10) - 1);
      
      if (error) throw error;
      
      return {
        data: {
          data: data || [],
          pagination: {
            total: count || 0,
            page: params?.page || 1,
            limit: params?.limit || 10,
            pages: Math.ceil((count || 0) / (params?.limit || 10))
          }
        } as T
      };
    }
    
    // Add other endpoint handlers as needed
    throw new Error(`Endpoint ${endpoint} not implemented yet`);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    console.log('API Request:', 'POST', endpoint, data);
    
    if (endpoint === '/users') {
      const { data: result, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          name: data.name,
          role: data.role
        }
      });
      
      if (error) throw error;
      
      return { data: result as T };
    }
    
    throw new Error(`Endpoint ${endpoint} not implemented yet`);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    console.log('API Request:', 'PUT', endpoint, data);
    
    if (endpoint.startsWith('/users/') && endpoint.endsWith('/reset-password')) {
      const userId = endpoint.split('/')[2];
      const { data: result, error } = await supabase.auth.admin.updateUserById(userId, {
        password: data.password
      });
      
      if (error) throw error;
      
      return { data: result as T };
    }
    
    if (endpoint.startsWith('/users/')) {
      const userId = endpoint.split('/')[2];
      const { data: result, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: result as T };
    }
    
    throw new Error(`Endpoint ${endpoint} not implemented yet`);
  }

  async delete<T = any>(endpoint: string): Promise<{ data: T }> {
    console.log('API Request:', 'DELETE', endpoint);
    
    if (endpoint.startsWith('/users/')) {
      const userId = endpoint.split('/')[2];
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      return { data: {} as T };
    }
    
    throw new Error(`Endpoint ${endpoint} not implemented yet`);
  }
}

const apiClient = new ApiClient();
export default apiClient;
