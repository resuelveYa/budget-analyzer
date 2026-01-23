import { getAccessToken } from '../supabase/client';

export function useClerkToken() {
  return getAccessToken;
}
