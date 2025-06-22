import { createClient } from '@supabase/supabase-js';
import config from './config';

// Create Supabase client
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

// For admin/service role operations that require higher privileges
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey || config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const connectDB = async (): Promise<void> => {
  try {
    console.log('Using Supabase as database provider');
    console.log('Supabase URL:', config.supabaseUrl);
    
    // Test connection by making a simple query
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Supabase connection successful');
    
  } catch (error: any) {
    console.error('Error connecting to Supabase:', error.message);
    console.error('Full error:', error);
    
    // Don't exit the process, try to continue
    console.log('Attempting to continue despite connection error...');
  }
};

export default connectDB;
