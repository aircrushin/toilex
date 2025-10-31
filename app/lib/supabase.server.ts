import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper function to get user from request headers
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
