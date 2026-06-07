import type { Book } from "@/lib/types";

export function BookCover({ book, size = "md" }: { book: Book; size?: "sm" | "md" | "lg" }) {
  const h = book.cover_hue;
  const dims =
    size === "sm"
      ? "h-20 w-16 text-base"
      : size === "lg"
        ? "h-48 w-36 text-3xl"
        : "h-32 w-24 text-xl";
  if (book.cover_url) {
    return (
      <div className={`${dims} relative shrink-0 rounded-md shadow-md overflow-hidden bg-muted`}>
        <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      /* 🛠️ Swapped font-serif to font-sans so fallback book titles render in clean sans-serif */
      className={`${dims} relative shrink-0 rounded-md shadow-md overflow-hidden flex items-center justify-center text-center px-2 font-sans font-bold text-white/95`}
      style={{
        background: `linear-gradient(135deg, oklch(0.55 0.12 ${h}), oklch(0.38 0.09 ${(h + 30) % 360}))`,
      }}
    >
      <span className="absolute inset-y-0 left-1 w-[3px] bg-black/20" />
      <span className="leading-tight drop-shadow-sm">{book.title}</span>
    </div>
  );
}
