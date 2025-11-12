import { createClient } from '@supabase/supabase-js';

// Debug: Log what we find
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  VITE_SUPABASE_URL: supabaseUrl ? '✓ SET' : '✗ MISSING',
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ SET' : '✗ MISSING',
  urlValue: supabaseUrl,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables.\n` +
    `VITE_SUPABASE_URL: ${supabaseUrl ? 'found' : 'MISSING'}\n` +
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'found' : 'MISSING'}\n\n` +
    `Make sure .env.development.local exists with:\n` +
    `VITE_SUPABASE_URL="..."\n` +
    `VITE_SUPABASE_ANON_KEY="..."`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
