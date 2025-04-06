
import { createClient } from '@supabase/supabase-js';
import { Tables } from './types';

// Get environment variables with fallback values for development
const supabaseUrl = "PASTE YOUR SUPABASE PROJECT URL";
const supabaseAnonKey = "PASTE YOUR SUPABASE PROJECT ANON KEY";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Tables };
