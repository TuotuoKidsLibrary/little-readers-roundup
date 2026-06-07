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

// 🛠️ 1. Updated inline shipping fulfillment list to be dual-language
const methods = [
  { id: "meetup", label: "Personal Meetup / 面交", sub: "Coordinate location in-app / 协调面交地点", Icon: MapPin },
  { id: "media-mail", label: "USPS Media Mail / 邮寄", sub: "Standard low-cost shipping / 低成本标准图书邮寄", Icon: Truck },
  { id: "porch", label: "Porch Pickup / 自提", sub: "Safe contactless pickup / 无接触自提", Icon: Home },
];

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
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState("meetup");
  const [note, setNote] = useState("");

  if (!book) return null;

  const isSale = book.status === "for_sale";
  const isDonation = book.status === "donation";

  // 🛠️ 2. Translated dynamic button text variables to a clear inline split layout
  const cta = isSale 
    ? "Buy Book / 购买绘本" 
    : isDonation 
      ? "Request from Library / 向图书馆申请" 
      : "Request to Borrow / 申请借阅";

  const reset = () => {
    setShowForm(false);
    setMethod("meetup");
    setNote("");
  };

  const submit = () => {
    const m = methods.find((x) => x.id === method)!.label;
    requestBook(book, m, note);
    toast.success("Exchange request submitted successfully! / 请求提交成功！", {
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
        {/* 🛠️ 3. Main header layout translation and font cleanup */}
        <SheetHeader className="text-left">
          <SheetTitle className="font-sans font-bold text-xl">Book Details / 绘本详情</SheetTitle>
          <SheetDescription className="font-sans">
            Review and arrange this exchange. / 查阅并安排此次分享。
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 flex flex-col gap-5 mt-6">
          <div className="flex gap-4 items-center">
            <BookCover book={book} size="lg" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {/* 🛠️ 4. Changed font-serif to font-sans for clean title presentation */}
              <h2 className="font-sans text-xl font-bold leading-tight break-words">{book.title}</h2>
              <p className="text-sm text-muted-foreground truncate">{book.author}</p>
              <p className="text-xs text-muted-foreground">ISBN {book.isbn}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary">{book.script_type === "Simplified" ? "简体" : "繁体"}</Badge>
                <Badge variant="secondary">Ages / 适读年龄: {book.age_range}</Badge>
                {book.price ? <Badge className="bg-primary text-primary-foreground">${book.price}</Badge> : null}
              </div>
            </div>
          </div>

          {/* 🛠️ 5. Translated "Shared by" summary status component block */}
          <div className="rounded-lg bg-muted/60 p-3 text-xs flex flex-col gap-0.5">
            <span className="text-muted-foreground">Shared by / 分享者:</span>
            <span className="font-medium text-sm text-foreground">{book.owner_name}</span>
          </div>

          {!showForm ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="font-sans py-5 text-sm"
                onClick={() => setShowForm(true)}
                disabled={book.status === "reserved"}
              >
                {book.status === "reserved" ? "Currently Reserved / 已被预约" : cta}
              </Button>
              {/* 🛠️ 6. Translated "Save for later" custom outline secondary layout line */}
              <Button variant="outline" size="lg" className="font-sans py-5 text-sm text-muted-foreground hover:text-foreground gap-1.5">
                <Heart className="size-4 text-red-500/80" /> Save for Later / 加入阅读清单
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4 font-sans">
              <div>
                <h3 className="font-sans font-bold text-base">Fulfillment Details / 取书方式</h3>
                <p className="text-xs text-muted-foreground">Choose how you'd like to receive this book. / 选择您方便的取书渠道。</p>
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

              {/* 🛠️ 7. Translated input text fields labels and fallback text descriptions */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note" className="text-sm font-medium flex flex-col gap-0.5">
                  <span>Message to Owner / 给书主的留言</span>
                  <span className="text-xs text-muted-foreground font-normal">(Optional details, preferred times / 可选：方便的取书时间等)</span>
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Hey! Saturdays after 10am work best for me… / 您好！我周六上午10点之后方便自提…"
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 py-5 text-xs" onClick={() => setShowForm(false)}>
                  Back / 返回
                </Button>
                <Button className="flex-1 py-5 text-xs" onClick={submit}>
                  Submit Request / 确认提交
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
