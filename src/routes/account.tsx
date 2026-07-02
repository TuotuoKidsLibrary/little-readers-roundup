import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Wallet, Settings, Sparkles, MapPin, Heart, Check, X, Camera, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { AuthDialog } from "@/components/AuthDialog";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Membership — 账号和会员信息" },
      { name: "description", content: "Manage your profile, membership, and wallet." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, updateProfile, uploadAvatar, isAuthenticated } = useStore();
  const { t } = useI18n();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [neighborhood, setNeighborhood] = useState(user.neighborhood_location);
  const [zip, setZip] = useState(user.zip_code);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setNeighborhood(user.neighborhood_location);
    setZip(user.zip_code);
  }, [user]);

  const handleAvatarClick = () => {
    if (!isAuthenticated) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadingAvatar(true);
    const { error } = await uploadAvatar(file);
    setUploadingAvatar(false);

    if (error) {
      toast.error("Couldn't upload photo", { description: error });
    } else {
      toast.success("Profile picture updated!");
    }
  };

  const handleSave = async () => {
    await updateProfile({
      name: name,
      neighborhood_location: neighborhood,
      zip_code: zip,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name);
    setNeighborhood(user.neighborhood_location);
    setZip(user.zip_code);
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 space-y-5">
      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap">{t("account_title")}</h1>

      <Card className="p-5 bg-card space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-14">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold">
                {isAuthenticated ? name.split(" ").map((w) => w[0]).join("") : "GV"}
              </AvatarFallback>
            </Avatar>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-card shadow-sm hover:bg-primary/90"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
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
              </>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1 text-muted-foreground">
                    <X className="size-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Check className="size-4" /> Save
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
          <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{t("wallet_coming_soon")}</p>
            <p>{t("wallet_coming_soon_body")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
