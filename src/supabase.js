import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

const isValidUrl = (url) => {
  try {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseConfig.url)
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Supabase not configured') }),
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null })
      })
    };

export default supabase;
