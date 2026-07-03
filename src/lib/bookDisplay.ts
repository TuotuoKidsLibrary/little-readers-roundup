import type { Book, ScriptType } from "./types";
import type { Lang, TKey } from "./i18n";

/**
 * `title` / `author` are always treated as the Chinese (original) fields.
 * `title_en` / `author_en` are optional — filled in only when a contributor
 * knows the English version of a translated book.
 *
 * When the app is toggled to English but no English title/author was
 * provided, we fall back to showing the Chinese info rather than blank text.
 */
export function getDisplayTitle(book: Pick<Book, "title" | "title_en">, lang: Lang): string {
  if (lang === "en" && book.title_en?.trim()) return book.title_en;
  return book.title;
}

export function getDisplayAuthor(book: Pick<Book, "author" | "author_en">, lang: Lang): string {
  if (lang === "en" && book.author_en?.trim()) return book.author_en;
  return book.author;
}

/** True when a translated/English title or author was entered for this book. */
export function hasEnglishInfo(book: Pick<Book, "title_en" | "author_en">): boolean {
  return Boolean(book.title_en?.trim() || book.author_en?.trim());
}

/**
 * Maps a book's script_type to its i18n label key. Previously several call
 * sites used `script_type === "Simplified" ? simplified : traditional`,
 * which silently mislabeled "Bilingual" books as Traditional Chinese.
 */
export function getScriptTypeKey(scriptType: ScriptType): TKey {
  if (scriptType === "Simplified") return "script_simplified";
  if (scriptType === "Bilingual") return "script_bilingual";
  return "script_traditional";
}
