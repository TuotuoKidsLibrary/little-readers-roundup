/**
 * Shared ISBN lookup logic used by the "Contribute a book" flow.
 * Consolidates what used to be two separate, slightly different copies of
 * this logic (one inline in LogBookDialog, one unused in store.tsx).
 */

import { lookupIsbnJisu } from "./isbnLookup.functions";

export interface IsbnLookupResult {
  title: string;
  author: string;
  coverUrl?: string;
  source: IsbnLookupSource;
}

export type IsbnLookupSource = "openlibrary" | "google" | "jisu";

export const isbnSourceLabels: Record<IsbnLookupSource, { en: string; zh: string }> = {
  openlibrary: { en: "Open Library", zh: "Open Library" },
  google: { en: "Google Books", zh: "Google Books" },
  jisu: { en: "Jisu (极速数据)", zh: "极速数据" },
};

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

  // Run all three lookups in parallel so we can pick the most complete result
  // (especially one that includes a cover image), instead of accepting the first
  // source that returns any hit.
  const openLibrary = (async (): Promise<IsbnLookupResult | null> => {
    try {
      const res = await fetchWithTimeout(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&jscmd=data&format=json`,
        4000,
        signal,
      );
      const json = (await res.json()) as Record<string, { title?: string; authors?: { name: string }[] }>;
      const entry = json[`ISBN:${cleaned}`];
      if (!entry?.title) return null;
      const candidateCover = `https://covers.openlibrary.org/b/isbn/${cleaned}-L.jpg`;
      const hasCover = await verifyCoverUrl(candidateCover);
      return {
        title: entry.title,
        author: entry.authors?.[0]?.name ?? "",
        coverUrl: hasCover ? candidateCover : undefined,
        source: "openlibrary",
      };
    } catch {
      return null;
    }
  })();

  const google = (async (): Promise<IsbnLookupResult | null> => {
    try {
      const res = await fetchWithTimeout(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleaned}`,
        4000,
        signal,
      );
      const json = (await res.json()) as {
        items?: { volumeInfo?: { title?: string; authors?: string[]; imageLinks?: { thumbnail?: string } } }[];
      };
      const info = json.items?.[0]?.volumeInfo;
      if (!info?.title) return null;
      return {
        title: info.title,
        author: info.authors?.[0] ?? "",
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        source: "google",
      };
    } catch {
      return null;
    }
  })();

  const jisu = (async (): Promise<IsbnLookupResult | null> => {
    try {
      const result = await lookupIsbnJisu({ data: { isbn: cleaned } });
      if (!result?.title) return null;
      return {
        title: result.title,
        author: result.author ?? "",
        coverUrl: result.coverUrl,
        source: "jisu",
      };
    } catch {
      return null;
    }
  })();

  const results = (await Promise.all([openLibrary, google, jisu])).filter(
    (r): r is IsbnLookupResult => !!r,
  );

  if (signal?.aborted || results.length === 0) return null;

  // Score by completeness — cover is the most valuable field, then author.
  // Ties fall back to source preference (Open Library → Google → Jisu).
  const sourceRank: Record<IsbnLookupSource, number> = { openlibrary: 0, google: 1, jisu: 2 };
  const score = (r: IsbnLookupResult) =>
    (r.coverUrl ? 3 : 0) + (r.author?.trim() ? 1 : 0) + (r.title?.trim() ? 1 : 0);

  results.sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return sourceRank[a.source] - sourceRank[b.source];
  });

  return results[0];
}
