import { useState } from "react";
import type { Book } from "@/lib/types";

interface BookCoverProps {
  book: Book;
  size?: "sm" | "md" | "lg";
}

export function BookCover({ book, size = "md" }: BookCoverProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-14 text-[9px]",
    md: "w-16 h-22 text-[11px] shrink-0 shadow-sm",
    lg: "w-28 h-40 text-sm shrink-0 shadow-md",
  };

  const cleanIsbn = book.isbn ? book.isbn.replace(/[- ]/g, "").trim() : null;

  // Open Library has a highly reliable, completely un-throttled public image hosting system
  const realCoverUrl = cleanIsbn 
    ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=false`
    : null;

  if (realCoverUrl && !imgError) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-md overflow-hidden bg-muted border border-border/40`}>
        <img
          src={realCoverUrl}
          alt={book.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          onError={() => setImgError(true)} // Instantly activates the styled placeholder frame if image isn't found
        />
      </div>
    );
  }

  // 🌟 FALLBACK: Your original colorful stylized placeholder canvas blocks
  const hue = book.cover_hue ?? 25;
  return (
    <div
      style={{
        backgroundColor: `hsl(${hue}, 25%, 38%)`,
        color: `hsl(${hue}, 40%, 92%)`,
        borderColor: `hsl(${hue}, 25%, 32%)`,
      }}
      className={`${sizeClasses[size]} rounded-md border flex flex-col justify-between p-1.5 text-center font-serif font-bold leading-tight select-none break-all overflow-hidden`}
    >
      <span className="block w-full line-clamp-3">{book.title}</span>
      <span className="block w-full text-[0.65em] font-sans font-normal opacity-70 truncate">
        {book.author}
      </span>
    </div>
  );
}
