import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditCard, ShieldCheck, Wallet, Settings, Sparkles, MapPin, Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { AuthDialog } from "@/components/AuthDialog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Membership — 小书阁" },
      { name: "description", content: "Manage your profile, membership, and wallet." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, updateProfile, isAuthenticated } = useStore();
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 space-y-5">
      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">{t("account_title")}</h1>

      <Card className="p-5 bg-card space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold">
              {isAuthenticated ? user.name.split(" ").map((w) => w[0]).join("") : "GV"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-serif font-bold text-xl leading-none">
              {isAuthenticated ? user.name : t("account_guest_name")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAuthenticated ? t("account_member_since") : t("account_guest_subtitle")}
            </p>
          </div>
          {isAuthenticated && (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="size-4" /> {t("edit")}
            </Button>
          )}
        </div>

        {!isAuthenticated && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-accent/50 via-primary/5 to-background p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-serif font-bold text-lg">{t("unlock_perks")}</h3>
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">
              {t("account_signup_callout")}
            </p>
            <AuthDialog
              trigger={
                <Button size="sm" className="rounded-full shadow-sm">
                  {t("convert_account")}
                </Button>
              }
            />
          </div>
        )}

        <Separator />

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="neighborhood">{t("neighborhood_label")}</Label>
            <Input
              id="neighborhood"
              value={user.neighborhood_location}
              onChange={(e) => updateProfile({ neighborhood_location: e.target.value })}
              placeholder="e.g., Midtown, Parker Towers, Alpharetta"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="zip">{t("zip_label")}</Label>
            <Input
              id="zip"
              value={user.zip_code}
              onChange={(e) => updateProfile({ zip_code: e.target.value })}
              placeholder="11201"
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          <p className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            {t("neighborhood_hint")}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-accent/40 via-card to-background border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="size-5 text-primary" />
          <h2 className="font-serif font-bold text-lg break-words">{t("our_story_title")}</h2>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line break-words">
          {t("our_story_body")}
        </p>
      </Card>

      {isAuthenticated && (
      <Card className="p-5 bg-gradient-to-br from-primary/10 via-accent/30 to-background border-primary/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="mb-2 gap-1">
              <Sparkles className="size-3" /> {t("membership_badge")}
            </Badge>
            <h2 className="font-serif text-xl font-bold">{user.membership_status}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {t("membership_blurb")}
            </p>
          </div>
          <Button size="sm">{t("upgrade")}</Button>
        </div>
      </Card>
      )}

      {isAuthenticated && (
      <Card className="p-5 bg-card">
        <header className="flex items-center gap-2 mb-4">
          <Wallet className="size-5 text-primary" />
          <h2 className="font-serif font-bold text-lg">{t("wallet_title")}</h2>
        </header>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ShieldCheck className="size-3.5" /> {t("refundable_deposit")}
            </div>
            <p className="font-serif text-2xl font-bold">${user.deposit_balance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("deposit_hint")}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="size-3.5" /> {t("wallet_balance")}
            </div>
            <p className="font-serif text-2xl font-bold">${user.wallet_balance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("wallet_hint")}</p>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="size-4 text-muted-foreground" /> {t("billing")}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="card">{t("card_number")}</Label>
              <Input id="card" placeholder="•••• •••• •••• 4242" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="exp">{t("expiry")}</Label>
                <Input id="exp" placeholder="MM/YY" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cvc">{t("cvc")}</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">{t("save_payment")}</Button>
        </div>
      </Card>
      )}
    </div>
  );
}