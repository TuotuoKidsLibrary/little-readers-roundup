CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text,
  neighborhood_location text,
  zip_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  title_en text,
  author_en text,
  isbn text,
  script_type text NOT NULL DEFAULT 'Simplified',
  age_range text NOT NULL DEFAULT '3-5',
  status text NOT NULL DEFAULT 'available',
  price numeric,
  owner_id uuid NOT NULL,
  owner_name text,
  cover_hue integer NOT NULL DEFAULT 30,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public books readable" ON public.books FOR SELECT USING (status <> 'private' OR auth.uid() = owner_id);
CREATE POLICY "own books insert" ON public.books FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own books update" ON public.books FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own books delete" ON public.books FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.saved_books (
  user_id uuid NOT NULL,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_books TO authenticated;
GRANT ALL ON public.saved_books TO service_role;
ALTER TABLE public.saved_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved" ON public.saved_books FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  requester_id uuid NOT NULL,
  requester_name text,
  owner_id uuid NOT NULL,
  method text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read requests" ON public.requests FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, owner_id));
CREATE POLICY "requester creates" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "participants update requests" ON public.requests FOR UPDATE TO authenticated USING (auth.uid() IN (requester_id, owner_id));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "sender inserts" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "requester can reserve" ON public.books FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.book_id = books.id AND r.requester_id = auth.uid())
);

CREATE POLICY "covers read" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "covers own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);