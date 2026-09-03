import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { isPrototypeMode } from "@/lib/env";

const HIGHLIGHTS = [
  "Pull tests from your lab master — never invent codes",
  "Mark what patients can book, with prep and restrictions",
  "Build packages with pricing, fulfillment, and shareable links",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="login-brand relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="login-brand-grid pointer-events-none absolute inset-0 opacity-[0.08]"
        />
        <div
          aria-hidden
          className="login-brand-glow pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="login-brand-glow-alt pointer-events-none absolute -bottom-40 -left-20 size-[24rem] rounded-full blur-3xl"
        />
        <div className="relative z-10 p-10">
          <BrandLogo inverted variant="full" />
        </div>
        <div className="relative z-10 max-w-lg space-y-8 p-10 pb-16">
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.16em] text-white/55 uppercase">
              Saudi Diagnostic Limited
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white text-balance">
              The control plane for what patients can book.
            </h2>
            <p className="text-sm leading-relaxed text-white/65">
              SDL Catalog Admin is the configuration layer for your diagnostic patient portal —
              tests, packages, and booking rules in one workspace.
            </p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] leading-none text-white"
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <Suspense>
          <LoginForm showDemoCredentials={isPrototypeMode() || process.env.NODE_ENV !== "production"} />
        </Suspense>
        <p className="text-muted-foreground mt-8 text-center text-xs">
          Protected workspace · Saudi Diagnostic Limited
        </p>
      </main>
    </div>
  );
}
