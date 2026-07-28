import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side fallback ISBN lookup via jisuapi (中文书目库 with strong
 * Simplified Chinese coverage). Kept server-side so the API key stays
 * out of the browser bundle.
 */
export const lookupIsbnJisu = createServerFn({ method: "GET" })
  .inputValidator((data: { isbn: string }) => {
    if (!/^\d{13}$/.test(data.isbn)) {
      throw new Error("Invalid ISBN-13");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.JISU_API_KEY;
    if (!key) return null;

    const url = `https://api.jisuapi.com/isbn/query?appkey=${key}&isbn=${data.isbn}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        status?: number;
        msg?: string;
        result?: {
          title?: string;
          author?: string;
          pic?: string;
        };
      };
      if (json.status !== 0 || !json.result?.title) {
        console.warn(`[jisuapi] lookup failed status=${json.status} msg=${json.msg}`);
        return null;
      }
      return {
        title: json.result.title,
        author: json.result.author ?? "",
        coverUrl: json.result.pic || undefined,
      };
    } catch (err) {
      console.error("[jisuapi] request error", err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  });