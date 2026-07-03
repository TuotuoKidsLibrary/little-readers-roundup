import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, BookOpen, Tag, Heart, ScanLine, Lock, Lightbulb, Loader2, ImagePlus, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { AgeRange, Book, BookStatus, ScriptType } from "@/lib/types";
import { IsbnScanner } from "./IsbnScanner";
import { lookupBookByIsbn, normalizeIsbn, isValidIsbn13 } from "@/lib/isbnLookup";

export function LogBookDialog({ trigger, bookToEdit }: { trigger?: React.ReactNode; bookToEdit?: Book }) {
  const { addBook, updateBook, books, uploadBookCover } = useStore();
  const { t, lang } = useI18n();
  const isEditing = !!bookToEdit;
  const contributionOptions: {
    id: BookStatus;
    title: string;
    sub: string;
    Icon: typeof BookOpen;
  }[] = [
    { id: "available", title: t("status_lend"), sub: t("lend_sub"), Icon: BookOpen },
    { id: "for_sale", title: t("status_sell"), sub: t("sell_sub"), Icon: Tag },
    { id: "donation", title: t("status_donate"), sub: t("donate_sub"), Icon: Heart },
    { id: "private", title: t("status_private"), sub: t("private_sub"), Icon: Lock },
  ];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BookStatus>(bookToEdit?.status ?? "available");
  const [title, setTitle] = useState(bookToEdit?.title ?? "");
  const [author, setAuthor] = useState(bookToEdit?.author ?? "");
  const [titleEn, setTitleEn] = useState(bookToEdit?.title_en ?? "");
  const [authorEn, setAuthorEn] = useState(bookToEdit?.author_en ?? "");
  const [isbn, setIsbn] = useState(bookToEdit?.isbn ?? "");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(bookToEdit?.cover_url);
  const [script, setScript] = useState<ScriptType>(bookToEdit?.script_type ?? "Simplified");
  const [age, setAge] = useState<AgeRange>(bookToEdit?.age_range ?? "3-5");
  const [price, setPrice] = useState(bookToEdit?.price?.toString() ?? "");
  const [scanning, setScanning] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not_found" | "cached" | "editing">(
    isEditing ? "editing" : "idle"
  );
  const isbnRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const coverObjectUrlRef = useRef<string | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setStatus(bookToEdit?.status ?? "available");
    setTitle(bookToEdit?.title ?? "");
    setAuthor(bookToEdit?.author ?? "");
    setTitleEn(bookToEdit?.title_en ?? "");
    setAuthorEn(bookToEdit?.author_en ?? "");
    setIsbn(bookToEdit?.isbn ?? "");
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }
    setCoverFile(null);
    setUploadingCover(false);
    setCoverUrl(bookToEdit?.cover_url);
    setScript(bookToEdit?.script_type ?? "Simplified");
    setAge(bookToEdit?.age_range ?? "3-5");
    setPrice(bookToEdit?.price?.toString() ?? "");
    setScanning(false);
    setLookupState(isEditing ? "editing" : "idle");
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "en" ? "Please choose an image file." : "请选择图片文件。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === "en" ? "Image is too large (max 5MB)." : "图片过大（最大 5MB）。");
      return;
    }

    if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    coverObjectUrlRef.current = previewUrl;
    setCoverFile(file);
    setCoverUrl(previewUrl);
  };

  const clearCover = () => {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }
    setCoverFile(null);
    setCoverUrl(undefined);
  };

  const runLookup = async () => {
    const cleaned = normalizeIsbn(isbn);
    if (!isValidIsbn13(cleaned)) {
      toast.error(
        lang === "en"
          ? "Please enter a valid 13-digit ISBN."
          : "请输入有效的 13 位 ISBN。",
      );
      return;
    }
    // Keep the input showing the normalized form so future edits/comparisons are consistent
    if (cleaned !== isbn) setIsbn(cleaned);

    // Cancel any lookup still in flight for a previous ISBN so its result
    // can't land late and silently overwrite what the user is looking at now.
    lookupAbortRef.current?.abort();
    const controller = new AbortController();
    lookupAbortRef.current = controller;

    setLookupState("loading");

    const cached = books.find((b) => b.isbn === cleaned);
    if (cached) {
      setTitle(cached.title);
      setAuthor(cached.author);
      setTitleEn(cached.title_en ?? "");
      setAuthorEn(cached.author_en ?? "");
      setScript(cached.script_type);
      setAge(cached.age_range);
      if (cached.cover_url) {
        if (coverObjectUrlRef.current) {
          URL.revokeObjectURL(coverObjectUrlRef.current);
          coverObjectUrlRef.current = null;
        }
        setCoverFile(null);
        setCoverUrl(cached.cover_url);
      }
      setLookupState("cached");
      return;
    }

    const result = await lookupBookByIsbn(cleaned, controller.signal);

    // Bail out silently if this request was superseded (aborted) or the
    // component moved on (e.g. dialog closed / different ISBN entered).
    if (controller.signal.aborted || lookupAbortRef.current !== controller) return;

    if (result) {
      setTitle(result.title);
      setAuthor(result.author);
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
        coverObjectUrlRef.current = null;
      }
      setCoverFile(null);
      setCoverUrl(result.coverUrl);
      setLookupState("found");
      return;
    }

    setLookupState("not_found");
  };

  const saveBook = async () => {
    if (!title.trim()) {
      toast.error("Please enter the book title.");
      return;
    }

    let finalCoverUrl = coverUrl;
    if (coverFile) {
      setUploadingCover(true);
      const { url, error: uploadError } = await uploadBookCover(coverFile);
      setUploadingCover(false);
      if (uploadError || !url) {
        toast.error(lang === "en" ? "Couldn't upload cover photo." : "封面上传失败。", {
          description: uploadError ?? undefined,
        });
        return;
      }
      finalCoverUrl = url;
    }

    if (isEditing && bookToEdit) {
      const { error } = await updateBook(bookToEdit.id, {
        title: title.trim(),
        author: author.trim() || "Unknown",
        title_en: titleEn.trim() || undefined,
        author_en: authorEn.trim() || undefined,
        isbn: isbn.trim() || "—",
        script_type: script,
        age_range: age,
        status,
        price: status === "for_sale" ? Number(price) || 0 : undefined,
        cover_url: finalCoverUrl,
      });
      if (error) {
        toast.error("Couldn't save changes.", { description: error });
        return;
      }
      toast.success("Book updated!");
    } else {
      await addBook({
        title: title.trim(),
        author: author.trim() || "Unknown",
        title_en: titleEn.trim() || undefined,
        author_en: authorEn.trim() || undefined,
        isbn: isbn.trim() || "—",
        script_type: script,
        age_range: age,
        status,
        price: status === "for_sale" ? Number(price) || 0 : undefined,
        cover_url: finalCoverUrl,
      });
      toast.success(
        status === "donation"
          ? "Donation logged."
          : status === "for_sale"
            ? "Book listed for sale!"
            : status === "private"
              ? "Saved to your private shelf."
              : "Book added to the Library!",
      );
    }
    reset();
    setOpen(false);
  };

  const handleDetected = (code: string) => {
    setIsbn(code);
    setScanning(false);
    toast.success("ISBN captured from barcode!");
  };

  const showDetails =
    lookupState === "found" || lookupState === "not_found" || lookupState === "cached" || lookupState === "editing";
  const loading = lookupState === "loading";

  useEffect(() => {
    return () => {
      if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current);
      lookupAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (lookupState === "not_found") {
      const id = setTimeout(() => titleRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [lookupState]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 rounded-full">
            <PlusCircle className="size-4" /> {t("contribute")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {isEditing ? (lang === "zh" ? "编辑书本信息" : "Edit Book") : t("contribute_title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "\n" : t("contribute_subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-background/60 p-3 flex flex-col gap-2.5">
            {scanning ? (
              <IsbnScanner
                onDetected={handleDetected}
                onClose={() => setScanning(false)}
                onManualFallback={() => {
                  setScanning(false);
                  setTimeout(() => isbnRef.current?.focus(), 50);
                }}
              />
            ) : (
              <Button
                type="button"
                onClick={() => setScanning(true)}
                variant="outline"
                className="w-full justify-center gap-2 rounded-lg border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <ScanLine className="size-4" /> {t("scan_isbn")}
              </Button>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="isbn" className="text-xs text-muted-foreground">{t("manual_entry")}</Label>
              <Input
                id="isbn"
                ref={isbnRef}
                value={isbn}
                onChange={(e) => {
                  setIsbn(e.target.value);
                  if (lookupState === "loading") lookupAbortRef.current?.abort();
                  if (lookupState !== "idle") setLookupState("idle");
                }}
                placeholder="978XXXXXXXXXX"
                inputMode="numeric"
                maxLength={17}
              />
            </div>
            {!showDetails && (
              <Button
                type="button"
                onClick={runLookup}
                disabled={loading || !isbn.trim()}
                className="w-full rounded-lg gap-2"
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("searching_db")}
                  </>
                ) : (
                  t("lookup_book")
                )}
              </Button>
            )}
            {lookupState === "not_found" && (
              <p className="text-xs text-foreground/80 rounded-lg bg-accent/40 border border-accent p-2.5">
                {t("isbn_not_found")}
              </p>
            )}
            {(lookupState === "not_found" || lookupState === "editing") && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t("book_cover_label")}</Label>
                {lookupState === "not_found" && (
                  <p className="text-[11px] text-muted-foreground">{t("cover_upload_hint")}</p>
                )}
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <input
                  ref={cameraFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <div className="flex items-center gap-3">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={title || "Book cover"}
                      className="h-16 w-12 object-cover rounded-sm border border-border shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-12 rounded-sm border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0">
                      <ImagePlus className="size-4" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-full"
                        onClick={() => coverFileRef.current?.click()}
                      >
                        <ImagePlus className="size-3.5" />
                        {coverUrl ? t("change_cover") : t("upload_cover")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-full"
                        onClick={() => cameraFileRef.current?.click()}
                      >
                        <Camera className="size-3.5" />
                        {t("take_picture")}
                      </Button>
                    </div>
                    {coverFile && (
                      <button
                        type="button"
                        onClick={clearCover}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground w-fit"
                      >
                        <X className="size-3" /> {t("remove_cover")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {lookupState === "found" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-serif font-bold text-sm break-words">{title}</span>
                  <span className="text-muted-foreground break-words">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">{t("pulled_from_ol")}</span>
                </div>
              </div>
            )}
            {lookupState === "editing" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-serif font-bold text-sm break-words">{title}</span>
                  <span className="text-muted-foreground break-words">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">{t("editing_saved_book")}</span>
                </div>
              </div>
            )}
            {lookupState === "cached" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-serif font-bold text-sm break-words">{title}</span>
                  <span className="text-muted-foreground break-words">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">{t("pulled_from_cache")}</span>
                </div>
              </div>
            )}
          </div>

          {showDetails && (
          <>
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("select_sharing_option")}
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {contributionOptions.map(({ id, title: optTitle, sub, Icon }) => {
                const active = status === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatus(id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border bg-background/60 hover:border-primary/40"
                    }`}
                  >
                    <span className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-serif font-bold text-sm">{optTitle}</span>
                      <span className="text-xs text-muted-foreground break-words">{sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {status === "for_sale" && (
            <div className="grid gap-1.5">
              <Label htmlFor="price">{t("asking_price")}</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="8" />
            </div>
          )}

          {status === "donation" && (
            <p className="text-xs text-muted-foreground rounded-lg bg-accent/40 border border-accent p-2.5">
              {t("donation_note")}
            </p>
          )}

          {status === "private" && (
            <p className="text-xs text-foreground/80 rounded-lg bg-muted/60 border border-border p-2.5 flex gap-2 items-start">
              <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{t("private_note")}</span>
            </p>
          )}

          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("confirm_book_details")}
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="title">{t("book_title")}</Label>
                <Input id="title" ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：好饿的毛毛虫" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="author">{t("author")}</Label>
                <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="grid gap-1.5 pt-1 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground pt-2 leading-snug">{t("english_info_hint")}</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="title_en">{t("book_title_en")}</Label>
                <Input id="title_en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. The Very Hungry Caterpillar" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="author_en">{t("author_en")}</Label>
                <Input id="author_en" value={authorEn} onChange={(e) => setAuthorEn(e.target.value)} placeholder="e.g. Eric Carle" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("script_type")}</Label>
                <RadioGroup value={script} onValueChange={(v) => setScript(v as ScriptType)} className="grid grid-cols-3 gap-2">
                  {(["Simplified", "Traditional", "Bilingual"] as ScriptType[]).map((s) => (
                    <Label key={s} className={`cursor-pointer rounded-md border p-2 text-center text-sm ${script === s ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value={s} className="sr-only" />
                      {s === "Simplified" ? t("script_simplified") : s === "Traditional" ? t("script_traditional") : t("script_bilingual")}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("age_range")}</Label>
                <RadioGroup value={age} onValueChange={(v) => setAge(v as AgeRange)} className="flex gap-2">
                  {(["0-2", "3-5", "6+"] as AgeRange[]).map((a) => (
                    <Label key={a} className={`flex-1 cursor-pointer rounded-md border p-2 text-center text-sm ${lang === 'en' ? 'whitespace-pre-line' : ''} ${age === a ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value={a} className="sr-only" />
                      {a === "0-2" ? t("age_0_2") : a === "3-5" ? t("age_3_5") : t("age_6_plus")}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button className="flex-1 rounded-full gap-2" onClick={saveBook} disabled={uploadingCover}>
              {uploadingCover ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {t("cover_uploading")}
                </>
              ) : isEditing ? (lang === "zh" ? "保存修改\u00a0\u00a0" : "Save Changes") : status === "private" ? t("save_to_private_shelf") : t("confirm_add_book")}
            </Button>
          </div>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
