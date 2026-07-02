import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LockedActionDialog({
  open,
  onOpenChange,
  onLogin,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLogin: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="font-serif text-xl text-center">{t("members_only")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("members_only_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full rounded-full" onClick={onLogin}>{t("login_or_signup")}</Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            {t("keep_browsing")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
