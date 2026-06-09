import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://nlmvpaaqccapulavtyez.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbXZwYWFxY2NhcHVsYXZ0eWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI1MzMsImV4cCI6MjA5NjUwODUzM30.kbFyeZoBkXwU9fOyGQKcgd9G9V0_b_1d55H5amxo8-Q";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment keys. Operating in offline fallback mode.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);
