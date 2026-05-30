import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditCard, ShieldCheck, Wallet, Settings, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

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
  const { user } = useStore();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 space-y-5">
      <h1 className="font-serif text-3xl font-bold">Account & Membership</h1>

      <Card className="p-5 flex items-center gap-4 bg-card">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold">
            {user.name.split(" ").map((w) => w[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-serif font-bold text-xl leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground mt-1">Member since May 2025 · Brooklyn, NY</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="size-4" /> Edit
        </Button>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-primary/10 via-accent/30 to-background border-primary/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="mb-2 gap-1">
              <Sparkles className="size-3" /> Membership
            </Badge>
            <h2 className="font-serif text-xl font-bold">{user.membership_status}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              You're in free testing mode — unlimited borrows and listings while we pilot the club.
            </p>
          </div>
          <Button size="sm">Upgrade</Button>
        </div>
      </Card>

      <Card className="p-5 bg-card">
        <header className="flex items-center gap-2 mb-4">
          <Wallet className="size-5 text-primary" />
          <h2 className="font-serif font-bold text-lg">Digital Wallet & Deposits</h2>
        </header>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ShieldCheck className="size-3.5" /> Refundable Security Deposit
            </div>
            <p className="font-serif text-2xl font-bold">${user.deposit_balance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Held while you have active loans.</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="size-3.5" /> Wallet Balance
            </div>
            <p className="font-serif text-2xl font-bold">${user.wallet_balance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earnings from sold books.</p>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="size-4 text-muted-foreground" /> Billing
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" placeholder="•••• •••• •••• 4242" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="MM/YY" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">Save payment method</Button>
        </div>
      </Card>
    </div>
  );
}