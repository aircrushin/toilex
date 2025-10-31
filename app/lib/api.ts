import { supabase } from './supabase.client';

// Helper to get auth headers for API requests
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {};
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
  };
}
