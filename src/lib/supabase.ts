import { createClient } from "@supabase/supabase-js";

// The community library (books, members, messages, saved books, cover photos)
// lives in the club's original database. These are public, browser-safe
// values (anon key, protected by row-level security) and are pinned here on
// purpose so environment changes can't silently point the app at an empty
// database again.
const ORIGINAL_DB_URL = "https://nlmvpaaqccapulavtyez.supabase.co";
const ORIGINAL_DB_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbXZwYWFxY2NhcHVsYXZ0eWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI1MzMsImV4cCI6MjA5NjUwODUzM30.kbFyeZoBkXwU9fOyGQKcgd9G9V0_b_1d55H5amxo8-Q";

export const supabase = createClient(ORIGINAL_DB_URL, ORIGINAL_DB_ANON_KEY);
