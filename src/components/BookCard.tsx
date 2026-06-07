import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";
import { useI18n } from "@/lib/i18n"; 

const statusConfig: Record<Book["status"], { key: "status_lend" | "status_sell" | "status_donate" | "status_private" | "btn_reserved"; cls: string }> = {
  available: { key: "status_lend", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  reserved: { key: "btn_reserved", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  for_sale: { key: "status_sell", cls: "bg-primary/15 text-primary border-primary/30" },
  donation: { key: "status_donate", cls: "bg-accent text-accent-foreground border-accent" },
  private: { key: "status_private", cls: "bg-muted text-muted-foreground border-border" },
};

export function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const { t } = useI18n(); 
  const s = statusConfig[book.status];
  
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-4 flex gap-3 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-card border-border/60"
    >
      <BookCover book={book} size="sm" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-sans font-bold text-base leading-snug truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/70">
            {book.script_type === "Simplified" ? t("script_simplified") : t("script_traditional")}
          </Badge>
        
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>
            {/* Added "as any" assertion to completely clear any rigid TypeScript parameter warnings */}
            {t(s.key as any)}
            {book.price ? ` · $${book.price}` : ""}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
