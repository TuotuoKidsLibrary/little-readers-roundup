import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(1000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Tuotuo Kids Library 妥妥绘本馆" },
      { name: "description", content: "Get in touch with the Tuotuo Kids Library team — questions, feedback, or ideas for our bilingual book community." },
      { property: "og:title", content: "Contact Us | Tuotuo Kids Library 妥妥绘本馆" },
      { property: "og:description", content: "Get in touch with the Tuotuo Kids Library team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error(t("contact_invalid"));
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) {
      toast.error(t("contact_error"));
      return;
    }
    toast.success(t("contact_success"));
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-full bg-primary/10 p-2.5">
          <Mail className="size-5 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">{t("contact_title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">{t("contact_subtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("contact_name")}</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("contact_email")}</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-message">{t("contact_message")}</Label>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            className="resize-none"
            required
          />
        </div>
        <Button type="submit" disabled={sending} className="w-full gap-2 rounded-full">
          <Send className="size-4" />
          {sending ? t("contact_sending") : t("contact_send")}
        </Button>
      </form>
    </div>
  );
}
