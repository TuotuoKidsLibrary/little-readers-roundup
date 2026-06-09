import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Edit3 } from "lucide-react";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const { t, lang } = useI18n();
  const { user, isAuthenticated } = useStore();

  // Check if the currently logged-in parent is the one who contributed this specific book
  const isMyContribution = isAuthenticated && book.owner_id === user.id;

  const getStatusBadge = () => {
    if (book.status === "reserved") {
      return (
        <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[11px] font-normal px-2 py-0">
          {lang === "en" ? "Reserved" : "已被预约"}
        </Badge>
      );
    }
    
    if (book.status === "for_sale") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[11px] font-normal px-2 py-0">
          {lang === "en" ? "For Sale" : "可出售"}{book.price ? ` · $${book.price}` : ""}
        </Badge>
      );
    }
    
    if (book.status === "donation") {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[11px] font-normal px-2 py-0">
          {lang === "en" ? "Donated" : "爱心捐赠"}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[11px] font-normal px-2 py-0">
        {lang === "en" ? "Available" : "可借阅"}
      </Badge>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`flex gap-4 items-center p-4 rounded-2xl border bg-card hover:bg-muted/30 cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden ${
        isMyContribution ? "border-primary/40 shadow-sm" : "border-border/50"
      }`}
    >
      <BookCover book={book} size="md" />
      
      <div className="flex flex-col gap-1 flex-1 min-w-0 text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans font-bold text-base text-foreground leading-snug truncate flex-1">
            {book.title}
          </h3>
          {isMyContribution && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-medium px-1.5 py-0 flex items-center gap-0.5 shrink-0">
              <Edit3 className="size-2.5" /> {lang === "en" ? "Mine" : "我的"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {book.author}
        </p>
        
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          <Badge variant="secondary" className="text-[11px] font-normal px-2 py-0 text-muted-foreground bg-muted/60">
            {book.script_type === "Simplified" ? t("script_simplified") : t("script_traditional")}
          </Badge>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
}
