# Architecture decisions

- Store member tagline, introduction, and avatar URL in authenticated user metadata because these fields belong to identity and must remain compatible with the existing profiles table.
- Store member profile images alongside user-owned book images in the existing `book-covers` storage bucket to reuse established upload access and public delivery.