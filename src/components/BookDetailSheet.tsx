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

const methods = [
  { id: "meetup", label: "Personal Meetup", sub: "Coordinate location in-app", Icon: MapPin },
  { id: "media-mail", label: "USPS Media Mail", sub: "Standard low-cost book shipping", Icon: Truck },
  { id: "porch", label: "Porch Pickup", sub: "Safe contactless pickup from owner's home", Icon: Home },
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
  const cta = isSale ? "Buy Book" : isDonation ? "Request from Library" : "Request to Borrow";

  const reset = () => {
    setShowForm(false);
    setMethod("meetup");
    setNote("");
  };

  const submit = () => {
    const m = methods.find((x) => x.id === method)!.label;
    requestBook(book, m, note);
    toast.success("Exchange request submitted successfully!", {
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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="font-serif">Book details</SheetTitle>
          <SheetDescription>Review and arrange this exchange.</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 flex flex-col gap-5">
          <div className="flex gap-4 items-center">
            <BookCover book={book} size="lg" />
            <div className="flex flex-col gap-1.5">
              <h2 className="font-serif text-2xl font-bold leading-tight">{book.title}</h2>
              <p className="text-sm text-muted-foreground">{book.author}</p>
              <p className="text-xs text-muted-foreground">ISBN {book.isbn}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary">{book.script_type}</Badge>
                <Badge variant="secondary">Ages {book.age_range}</Badge>
                {book.price ? <Badge>${book.price}</Badge> : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <span className="text-muted-foreground">Shared by </span>
            <span className="font-medium">{book.owner_name}</span>
          </div>

          {!showForm ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                onClick={() => setShowForm(true)}
                disabled={book.status === "reserved"}
              >
                {book.status === "reserved" ? "Currently Reserved" : cta}
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="size-4" /> Save for later
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4">
              <div>
                <h3 className="font-serif font-bold text-lg">Fulfillment Details</h3>
                <p className="text-xs text-muted-foreground">Choose how you'd like to receive this book.</p>
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
                      <span className="text-xs text-muted-foreground">{sub}</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note" className="text-sm">
                  Message to Owner <span className="text-muted-foreground font-normal">(Optional details, preferred times, etc.)</span>
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Hey! Saturdays after 10am work best for me…"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={submit}>
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}