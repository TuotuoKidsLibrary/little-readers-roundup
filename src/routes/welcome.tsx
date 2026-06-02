import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — 妥妥绘本馆" },
      { name: "description", content: "Join the community library." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { isAuthenticated } = useStore();
  if (isAuthenticated) return <Navigate to="/" />;
  return (
    <div className="mx-auto max-w-md px-4 pt-10 pb-16">
      <div className="text-center mb-8">
        <p className="font-serif text-3xl font-bold text-primary">妥妥绘本馆</p>
        <h1 className="font-serif text-2xl font-bold mt-3">Grow Our Library, Raise Bilingual Children</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Borrow, sell & share treasured 中文 picture books with neighbor families.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <AuthForm />
      </div>
    </div>
  );
}