Here is the updated code for **`src/components/BookDetailSheet.tsx`** matching your provided base logic. It preserves your exact text adjustments for `getActionLabel` while implementing the interactive save status functionality for the "Save for Later" trigger.

```tsx
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Truck, Home, Heart } from "lucide-react";
import { toast } from "sonner";
import type { Book } from "@/lib/types";
import { useStore } from "@/lib/store";
import { BookCover } from "./BookCover";
import { useI18n } from "@/lib/i18n"; 

export function BookDetailSheet({
  book,
  open,
  onOpenChange,
}: {
  book: Book | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { requestBook } = useStore();
  const { t, lang } = useI18n(); 
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState("meetup");
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!book) return null;

  const getActionLabel = () => {
    if (book.status === "reserved") {
      return lang === "en" ? "Reserved" : "已被预约";
    }
    if (book.status === "for_sale") {
      return lang === "en" ? "Buy" : "购买";
    }
    if (book.status === "donation") {
      return lang === "en" ? "Request to Borrow" : "申请借阅";
    }
    return lang === "en" ? "Request to Borrow" : "申请借阅";
  };

  const methods = [
    { id: "meetup", label: lang === "en" ? "Personal Meetup" : "面交", sub: lang === "en" ? "Coordinate location in-app" : "沟通协调面交地点", Icon: MapPin },
    { id: "media-mail", label: lang === "en" ? "USPS Media Mail" : "邮寄", sub: lang === "en" ? "Standard low-cost shipping" : "低成本标准图书邮寄", Icon: Truck },
    { id: "porch", label: lang === "en" ? "Porch Pickup" : "自提", sub: lang === "en" ? "Safe contactless pickup" : "无接触自提", Icon: Home },
  ];

  const handleSaveToggle = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (nextState) {
      toast.success(lang === "en" ? "Added to your favorites!" : "已添加到收藏夹！", {
        description: book.title,
      });
    } else {
      toast.info(lang === "en" ? "Removed from favorites" : "已从收藏夹中移除");
    }
  };

  const reset = () => {
    setShowForm(false);
    setMethod("meetup");
    setNote("");
  };

  const submit = () => {
    const m = methods.find((x) => x.id === method)!.label;
    requestBook(book, m, note);
    toast.success(lang === "en" ? "Exchange request submitted!" : "请求提交成功！", {
      description: `${book.title} · ${m}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-card font-sans">
        <SheetHeader className="text-left">
          <SheetTitle className="font-sans font-bold text-xl">{t("book_details_title")}</SheetTitle>
          <SheetDescription className="font-sans">
            {t("exchange_subtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 flex flex-col gap-5 mt-6">
          <div className="flex gap-4 items-center">
            <BookCover book={book} size="lg" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <h2 className="font-sans text-xl font-bold leading-tight break-words">{book.title}</h2>
              <p className="text-sm text-muted-foreground truncate">{book.author}</p>
              <p className="text-xs text-muted-foreground">ISBN {book.isbn}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary">
                  {book.script_type === "Simplified" ? t("script_simplified") : t("script_traditional")}
                </Badge>
                <Badge variant="secondary">{t("age_range")}: {book.age_range}</Badge>
                {book.price ? <Badge className="bg-primary text-primary-foreground">${book.price}</Badge> : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-xs flex flex-col gap-0.5">
            <span className="text-muted-foreground">{t("shared_by")}</span>
            <span className="font-medium text-sm text-foreground">{book.owner_name}</span>
          </div>

          {!showForm ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="font-sans py-5 text-sm font-semibold tracking-wide"
                onClick={() => setShowForm(true)}
                disabled={book.status === "reserved"}
              >
                {getActionLabel()}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleSaveToggle}
                className="font-sans py-5 text-sm text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Heart className={`size-4 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-red-500/80"}`} /> 
                {isSaved ? (lang === "en" ? "Saved" : "已收藏") : t("save_for_later")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4 font-sans">
              <div>
                <h3 className="font-sans font-bold text-base">{t("fulfillment_title")}</h3>
                <p className="text-xs text-muted-foreground">{t("fulfillment_desc")}</p>
              </div>

              <RadioGroup value={method} onValueChange={setMethod} className="flex flex-col gap-2">
                {methods.map(({ id, label, sub, Icon }) => (
                  <Label
                    key={id}
                    htmlFor={id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      method === id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={id} id={id} className="mt-1" />
                    <Icon className="size-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{label}</span>
                      <span className="text-xs text-muted-foreground leading-normal mt-0.5">{sub}</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note" className="text-sm font-medium flex flex-col gap-0.5">
                  <span>{t("message_to_owner")}</span>
                  <span className="text-xs text-muted-foreground font-normal">{t("message_hint")}</span>
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("message_placeholder")}
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 py-5 text-xs" onClick={() => setShowForm(false)}>
                  {t("btn_back")}
                </Button>
                <Button className="flex-1 py-5 text-xs" onClick={submit}>
                  {t("btn_submit")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

```
