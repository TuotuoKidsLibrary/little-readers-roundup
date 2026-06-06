import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";

const statusLabel: Record<Book["status"], { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  reserved: { label: "Reserved", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  for_sale: { label: "For Sale", cls: "bg-primary/15 text-primary border-primary/30" },
  donation: { label: "Donation", cls: "bg-accent text-accent-foreground border-accent" },
  private: { label: "Private", cls: "bg-muted text-muted-foreground border-border" },
};

export function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const s = statusLabel[book.status];
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-4 flex gap-3 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-card border-border/60"
    >
      <BookCover book={book} size="sm" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-serif font-bold text-base leading-snug truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/70">
            {book.script_type === "Simplified" ? "简" : book.script_type === "Traditional" ? "繁" : "中英"} · {book.age_range}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>
            {s.label}
            {book.price ? ` · $${book.price}` : ""}
          </Badge>
        </div>
      </div>
    </Card>
  );
}