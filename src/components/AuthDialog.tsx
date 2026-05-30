import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "./AuthForm";

export function AuthDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title = "Welcome to 中文绘本馆",
  description = "Log in or create a free account to join the community.",
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  title?: string;
  description?: string;
}) {
  const [internal, setInternal] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp! : internal;
  const setOpen = (o: boolean) => {
    if (!controlled) setInternal(o);
    onOpenChange?.(o);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AuthForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}