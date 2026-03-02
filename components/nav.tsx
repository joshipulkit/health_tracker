"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

const links: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log" },
  { href: "/goals", label: "Goals" },
  { href: "/insights", label: "Insights" },
  { href: "/onboarding", label: "Profile" },
  { href: "/settings", label: "Settings" }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-brand-200/70 bg-brand-50/85 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Body Metrics Tracker</h1>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-700">Personal Fat-Loss Console</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-700 text-white shadow-sm"
                    : "border border-brand-200 bg-white/90 text-brand-900 hover:-translate-y-px hover:bg-brand-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
