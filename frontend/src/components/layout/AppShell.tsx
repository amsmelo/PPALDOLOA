"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarRange, FolderKanban } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/components/ui/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />

        {/* Navegação rápida mobile */}
        <div className="flex lg:hidden items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 overflow-x-auto">
          {[
            { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
            { label: "Ciclos PPA", href: "/planejamento/ppa", icon: CalendarRange },
            {
              label: "Programas & Ações",
              href: "/planejamento/programas",
              icon: FolderKanban,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  active
                    ? "bg-gov-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
