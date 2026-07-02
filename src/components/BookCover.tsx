import { useState, useEffect } from "react";
import type { Book } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { getDisplayTitle, getDisplayAuthor } from "@/lib/bookDisplay";

interface BookCoverProps {
  book: Book;
  size?: "sm" | "md" | "lg";
}

export function BookCover({ book, size = "md" }: BookCoverProps) {
  const { lang } = useI18n();
  const [isValidImage, setIsValidImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: "w-10 h-14 text-[9px]",
    md: "w-16 h-22 text-[11px] shrink-0 shadow-sm",
    lg: "w-28 h-40 text-sm shrink-0 shadow-md",
  };

  const cleanIsbn = book.isbn ? book.isbn.replace(/[- ]/g, "").trim() : null;

  // Prefer the stored cover_url (from LogBookDialog ISBN lookup), then try Open Library
  const realCoverUrl = book.cover_url
    ? book.cover_url
    : cleanIsbn
      ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`
      : null;

  useEffect(() => {
    if (!realCoverUrl) {
      setIsValidImage(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.src = realCoverUrl;

    img.onload = () => {
      // Open Library returns a tiny 1x1 blank pixel image if the cover doesn't exist.
      // A valid book cover will always have a real width greater than 1 pixel!
      if (img.width > 1) {
        setIsValidImage(true);
      } else {
        setIsValidImage(false);
      }
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsValidImage(false);
      setIsLoading(false);
    };
  }, [book.isbn, realCoverUrl]);

  // While checking the server, render a neutral background box to prevent flickering
  if (isLoading) {
    return <div className={`${sizeClasses[size]} rounded-md bg-muted animate-pulse`} />;
  }

  // If a genuine image was validated, display it safely
  if (realCoverUrl && isValidImage) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-md overflow-hidden bg-muted border border-border/40`}>
        <img
          src={realCoverUrl}
          alt={getDisplayTitle(book, lang)}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: Render your beautiful custom color-coded text block
  const hue = book.cover_hue ?? 25;
  return (
    <div
      style={{
        backgroundColor: `hsl(${hue}, 25%, 38%)`,
        color: `hsl(${hue}, 40%, 92%)`,
        borderColor: `hsl(${hue}, 25%, 32%)`,
      }}
      className={`${sizeClasses[size]} rounded-md border flex flex-col justify-between p-2 text-center font-serif font-bold leading-tight select-none break-all overflow-hidden`}
    >
      <span className="block w-full line-clamp-3">{getDisplayTitle(book, lang)}</span>
      <span className="block w-full text-[0.65em] font-sans font-normal opacity-70 truncate pb-0.5">
        {getDisplayAuthor(book, lang)}
      </span>
    </div>
  );
}
