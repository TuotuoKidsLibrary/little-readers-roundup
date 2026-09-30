import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Wallet, Settings, Sparkles, MapPin, Heart, Check, X, Camera, LoaderCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { AuthDialog } from "@/components/AuthDialog";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Membership — 账号和会员信息" },
      { name: "description", content: "Manage your profile, membership, and wallet." },
      { property: "og:title", content: "Account & Membership — Tuotuo Kids Library" },
      { property: "og:description", content: "Manage your Tuotuo Kids Library member profile and membership." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, updateProfile, uploadProfilePhoto, isAuthenticated } = useStore();
  const { t } = useI18n();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [neighborhood, setNeighborhood] = useState(user.neighborhood_location);
  const [zip, setZip] = useState(user.zip_code);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [tagline, setTagline] = useState(user.tagline);
  const [intro, setIntro] = useState(user.intro);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setName(user.name);
    setNeighborhood(user.neighborhood_location);
    setZip(user.zip_code);
    setAvatarUrl(user.avatar_url);
    setTagline(user.tagline);
    setIntro(user.intro);
  }, [user]);

  const handleSave = async () => {
    await updateProfile({
      name: name,
      neighborhood_location: neighborhood,
      zip_code: zip,
      avatar_url: avatarUrl,
      tagline: tagline.trim(),
      intro: intro.trim(),
    });
    setIsEditing(false);
    toast.success(t("profile_saved"));
  };

  const handleCancel = () => {
    setName(user.name);
    setNeighborhood(user.neighborhood_location);
    setZip(user.zip_code);
    setAvatarUrl(user.avatar_url);
    setTagline(user.tagline);
    setIntro(user.intro);
    setIsEditing(false);
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const result = await uploadProfilePhoto(file);
    setIsUploading(false);
    event.target.value = "";
    if (result.error || !result.url) {
      toast.error(t("profile_photo_error"), { description: result.error ?? undefined });
      return;
    }
    setAvatarUrl(result.url);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 space-y-5">
      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">{t("account_title")}</h1>

      <Card className="p-5 bg-card space-y-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-3 sm:block">
          <Avatar className="size-20 ring-2 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold">
              {isAuthenticated ? name.split(" ").map((w) => w[0]).join("") : "GV"}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <div className="sm:mt-2 sm:text-center">
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <label htmlFor="profile-photo" className="cursor-pointer">
                  {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  {isUploading ? t("photo_uploading") : avatarUrl ? t("change_profile_photo") : t("upload_profile_photo")}
                </label>
              </Button>
              <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhoto} disabled={isUploading} />
              <p className="mt-1 text-[10px] text-muted-foreground">{t("photo_upload_hint")}</p>
            </div>
          )}
          </div>
          <div className="flex-1 space-y-1">
            {isEditing ? (
              <div className="grid gap-1.5 max-w-xs">
                <Label htmlFor="edit-name" className="text-xs">{t("display_name_label")}</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ) : (
              <>
                <p className="font-serif font-bold text-xl leading-none">
                  {isAuthenticated ? user.name : t("account_guest_name")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAuthenticated ? t("account_member_since") : t("account_guest_subtitle")}
                </p>
                {isAuthenticated && user.tagline && (
                  <p className="pt-2 text-sm font-medium text-foreground/80">{user.tagline}</p>
                )}
              </>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex w-full gap-2 sm:w-auto">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1 text-muted-foreground">
                    <X className="size-4" /> {t("cancel_editing")}
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Check className="size-4" /> {t("save_profile")}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                  <Settings className="size-4" /> {t("edit")}
                </Button>
              )}
            </div>
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

        {isAuthenticated && (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="tagline">{t("tagline_label")}</Label>
              {isEditing ? (
                <>
                  <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value.slice(0, 80))} placeholder={t("tagline_placeholder")} maxLength={80} />
                  <p className="text-right text-[11px] text-muted-foreground">{tagline.length}/80</p>
                </>
              ) : (
                <p className="min-h-6 text-sm text-foreground/80">{user.tagline || "—"}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="intro">{t("intro_label")}</Label>
              {isEditing ? (
                <>
                  <Textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value.slice(0, 500))} placeholder={t("intro_placeholder")} maxLength={500} className="min-h-28 resize-y" />
                  <p className="text-right text-[11px] text-muted-foreground">{intro.length}/500</p>
                </>
              ) : (
                <p className="min-h-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{user.intro || "—"}</p>
              )}
            </div>
          </div>
        )}

        {isAuthenticated && <Separator />}

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="neighborhood">{t("neighborhood_label")}</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              disabled={!isEditing}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g., Midtown, Parker Towers, Alpharetta"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="zip">{t("zip_label")}</Label>
            <Input
              id="zip"
              value={zip}
              disabled={!isEditing}
              onChange={(e) => setZip(e.target.value)}
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
              <h2 className="font-serif text-xl font-bold">{"\n"}</h2>
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
          <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{t("wallet_coming_soon")}</p>
            <p>{t("wallet_coming_soon_body")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
