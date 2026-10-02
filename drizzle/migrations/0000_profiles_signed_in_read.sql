DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles readable by signed-in members" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.profiles FROM anon;