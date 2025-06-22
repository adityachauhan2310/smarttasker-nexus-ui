// This file re-exports the supabase-js library functionality
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session, User, AuthError } from '@supabase/supabase-js';
import type { Database } from './types';

export { createClient };
export type { SupabaseClient, Session, User, AuthError, Database };