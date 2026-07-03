/**
 * Shared ISBN lookup logic used by the "Contribute a book" flow.
 * Consolidates what used to be two separate, slightly different copies of
 * this logic (one inline in LogBookDialog, one unused in store.tsx).
 */

export interface IsbnLookupResult {
  title: string;
  author: string;
  coverUrl?: string;
}

/** Strips whitespace/dashes so pasted ISBNs like "978-7-020-04249-4" validate correctly. */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[\s-]/g, "").trim();
}

export function isValidIsbn13(isbn: string): boolean {
  return /^\d{13}$/.test(isbn);
}

async function fetchWithTimeout(url: string, ms: number, signal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  // If the caller's signal aborts (e.g. component unmounted / stale request), abort this fetch too.
  const onOuterAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onOuterAbort);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

/**
 * Open Library returns a 1x1 placeholder pixel (not a 404) for books with
 * no cover art on file. Loading it as an <img> and checking its natural
 * width is the only reliable client-side way to detect that.
 */
function verifyCoverUrl(url: string, ms = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), ms);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.naturalWidth > 1);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

/**
 * Looks up a book by ISBN-13, trying Open Library first, then Google Books.
 * Both calls are individually timeout-protected so a slow/unresponsive API
 * can't hang the caller indefinitely. Pass an AbortSignal (e.g. tied to the
 * current ISBN) so a stale in-flight lookup can be cancelled if the user
 * changes the ISBN before it resolves.
 */
export async function lookupBookByIsbn(
  isbn: string,
  signal?: AbortSignal,
): Promise<IsbnLookupResult | null> {
  const cleaned = normalizeIsbn(isbn);
  if (!isValidIsbn13(cleaned)) return null;

  // Open Library
  try {
    const res = await fetchWithTimeout(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&jscmd=data&format=json`,
      4000,
      signal,
    );
    if (signal?.aborted) return null;
    const json = (await res.json()) as Record<string, { title?: string; authors?: { name: string }[] }>;
    const entry = json[`ISBN:${cleaned}`];
    if (entry?.title) {
      const candidateCover = `https://covers.openlibrary.org/b/isbn/${cleaned}-L.jpg`;
      const hasCover = await verifyCoverUrl(candidateCover);
      if (signal?.aborted) return null;
      return {
        title: entry.title,
        author: entry.authors?.[0]?.name ?? "",
        coverUrl: hasCover ? candidateCover : undefined,
      };
    }
  } catch {
    /* fall through to Google Books */
  }

  if (signal?.aborted) return null;

  // Google Books
  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleaned}`,
      4000,
      signal,
    );
    if (signal?.aborted) return null;
    const json = (await res.json()) as {
      items?: { volumeInfo?: { title?: string; authors?: string[]; imageLinks?: { thumbnail?: string } } }[];
    };
    const info = json.items?.[0]?.volumeInfo;
    if (info?.title) {
      const img = info.imageLinks?.thumbnail?.replace("http:", "https:");
      return {
        title: info.title,
        author: info.authors?.[0] ?? "",
        coverUrl: img,
      };
    }
  } catch {
    /* fall through to null (not found) */
  }

  return null;
}
