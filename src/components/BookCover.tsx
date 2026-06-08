import { useState, useEffect } from "react";
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

  const realCoverUrl = cleanIsbn 
    ? `https://books.google.com/books/content?id=&vid=ISBN:${cleanIsbn}&printsec=frontcover&img=1&zoom=1`
    : null;

  // Reset error state if the book record changes
  useEffect(() => {
    setImgError(false);
  }, [book.isbn]);

  if (realCoverUrl && !imgError) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-md overflow-hidden bg-muted border border-border/40`}>
        <img
          src={realCoverUrl}
          alt={book.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }


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
      <span className="block w-full line-clamp-3">{book.title}</span>
      <span className="block w-full text-[0.65em] font-sans font-normal opacity-70 truncate pb-0.5">
        {book.author}
      </span>
    </div>
  );
}
