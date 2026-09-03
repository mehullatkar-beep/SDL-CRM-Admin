"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ showDemoCredentials = false }: { showDemoCredentials?: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/catalog/tests";
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8 lg:hidden">
        <BrandLogo variant="full" />
      </div>
      <Card className="gap-0 py-0 shadow-sm">
        <CardHeader className="border-b px-6 py-6 sm:px-8">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your workspace</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Use your lab credentials to manage the catalog patients can book.
          </p>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-8">
        <form action={action} className="space-y-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@lab.com"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-10"
            />
          </div>
          {state?.error ? (
            <ErrorState
              compact
              title="Unable to sign in"
              description={state.error}
            />
          ) : null}
          <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
            {pending ? "Signing in…" : "Continue"}
          </Button>
        </form>
        </CardContent>
      </Card>
      {showDemoCredentials ? (
      <div className="mt-5 rounded-xl border bg-card px-4 py-3.5 shadow-xs">
        <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <ShieldCheck className="size-3.5" />
          Prototype demo login
        </p>
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-muted-foreground">Admin</span>{" "}
            <span className="font-medium">admin@sdl.local</span>
            <span className="text-muted-foreground"> · Admin123!</span>
          </p>
          <p>
            <span className="text-muted-foreground">CRM</span>{" "}
            <span className="font-medium">crm@sdl.local</span>
            <span className="text-muted-foreground"> · Crm123!</span>
          </p>
        </div>
      </div>
      ) : null}
    </div>
  );
}
