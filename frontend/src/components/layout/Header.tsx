"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { TenantSelector } from "@/components/layout/TenantSelector";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Visão Geral / Dashboard",
  planejamento: "Planejamento Municipal",
  ppa: "Gestão de Ciclos do PPA",
  programas: "Programas Governamentais & Ações",
};

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur">
      {/* Breadcrumbs de Navegação */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-slate-500 hover:text-gov-700 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden md:inline font-medium">Início</span>
        </Link>

        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const label = ROUTE_LABELS[seg] || seg;
          const href = "/" + segments.slice(0, idx + 1).join("/");

          return (
            <React.Fragment key={href}>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              {isLast ? (
                <span className="font-semibold text-slate-900">{label}</span>
              ) : (
                <Link
                  href={href === "/planejamento" ? "/planejamento/ppa" : href}
                  className="hover:text-gov-700 transition-colors"
                >
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Seletor de Município (X-Tenant-ID) */}
      <div className="flex items-center gap-3">
        <TenantSelector />
      </div>
    </header>
  );
}
