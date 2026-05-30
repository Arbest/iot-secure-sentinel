"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    setPending(false);
    if (!res?.ok || res.error) {
      setError("Invalid email or password.");
      return;
    }
    router.replace(res.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex items-center gap-3 lg:hidden">
        <LogoMark className="h-9 w-9" />
        <span className="text-xl font-semibold tracking-tight">Iris Gateway</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@iris.local"
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pl-9"
              required
            />
          </div>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      {process.env.NODE_ENV !== "production" ? (
        <p className="text-center text-xs text-muted-foreground">
          Dev seed account:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            admin@iris.local
          </code>
        </p>
      ) : null}
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="iris-mesh relative hidden h-full flex-col justify-between overflow-hidden p-12 text-white lg:flex">
      <div className="flex items-center gap-3">
        <LogoMark className="h-9 w-9" />
        <span className="text-xl font-semibold tracking-tight">Iris Gateway</span>
      </div>
      <p className="font-mono text-xs text-white/50">Operator console</p>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading sign-in form"
      className="flex w-full max-w-sm flex-col items-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>Preparing sign-in</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-6 py-12">
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
