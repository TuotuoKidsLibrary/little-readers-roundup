import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function LockedActionDialog({
  open,
  onOpenChange,
  onLogin,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLogin: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="font-serif text-xl text-center">Members only</DialogTitle>
          <DialogDescription className="text-center">
            Please log in or create a free account to contribute books, send messages, or manage your shelf!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full rounded-full" onClick={onLogin}>Log in / Sign up</Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Keep browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}