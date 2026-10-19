"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CalendarRange,
  Eye,
  FolderKanban,
  Landmark,
  Layers,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/components/ui/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
}

const PLANNING_NAV_ITEMS: NavItem[] = [
  {
    label: "Visão Geral / Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    label: "Gestão de PPA & Árvore",
    href: "/planejamento/ppa",
    icon: CalendarRange,
    badge: "4 Anos",
  },
  {
    label: "Programas, Ações & Metas",
    href: "/planejamento/programas",
    icon: FolderKanban,
  },
];

const FUTURE_MODULES_ITEMS: NavItem[] = [
  {
    label: "LOA & Dotações",
    href: "#",
    icon: Layers,
    badge: "Módulo 2",
    disabled: true,
  },
  {
    label: "Execução & Tesouraria",
    href: "#",
    icon: Wallet,
    badge: "Módulo 3",
    disabled: true,
  },
  {
    label: "Obras & Transparência",
    href: "#",
    icon: Eye,
    badge: "Módulo 4",
    disabled: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-slate-200 border-r border-slate-800 select-none z-20">
      {/* Identidade Visual do Sistema */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gov-600 text-white shadow-md shadow-gov-950/50">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <span className="block text-sm font-bold tracking-tight text-white">
            GovTech SGPF
          </span>
          <span className="block text-[11px] text-slate-400">
            Ciclo PPA • LDO • LOA
          </span>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Módulo 1 • Planejamento Municipal
          </p>
          <nav className="space-y-1">
            {PLANNING_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-gov-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        isActive
                          ? "bg-gov-800 text-gov-100"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Roadmap de Módulos do Monólito Modular */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Próximas Etapas do Ecossistema
          </p>
          <nav className="space-y-1">
            {FUTURE_MODULES_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-75"
                  title="Previsto nos próximos módulos do roadmap arquitetural"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-600" />
                    {item.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-400">
                    <Lock className="h-2.5 w-2.5" />
                    {item.badge}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Rodapé Institucional */}
      <div className="border-t border-slate-800 p-4 bg-slate-950/40">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-tight">
            <p className="font-semibold text-slate-200">
              Conformidade STN / MCASP
            </p>
            <p className="mt-0.5">
              Lei 4.320/64 & LRF (LC 101/00) • Isolamento Multitenant Ativo
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
