import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login, signup } = useStore();
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [zip, setZip] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("Please enter your name.");
        return;
      }
      signup({ name, email, password, neighborhood, zip });
      toast.success(`Welcome, ${name}!`);
    } else {
      login(email, password);
      toast.success("Welcome back!");
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full py-2 text-sm font-medium transition-colors ${
              mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {m === "login" ? t("login_tab") : t("signup_tab")}
          </button>
        ))}
      </div>

      {mode === "signup" && (
        <div className="grid gap-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Wei Chen" />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="hood">{t("neighborhood")}</Label>
            <Input id="hood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Midtown" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="zip">{t("zip")}</Label>
            <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="11201" inputMode="numeric" maxLength={10} />
          </div>
        </div>
      )}
      <Button type="submit" className="w-full rounded-full">
        {mode === "login" ? t("log_in") : t("create_my_account")}
      </Button>
    </form>
  );
}