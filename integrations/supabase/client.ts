import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'http://localhost:3000'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)