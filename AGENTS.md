# Project rules

- App data (books, profiles, requests, messages, saved books, cover storage, auth) lives in the original external database pinned in `src/lib/supabase.ts`; the Lovable Cloud instance is empty. Why: env changes once pointed the app at the empty database and hid all books.
