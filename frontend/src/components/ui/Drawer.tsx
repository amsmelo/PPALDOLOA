"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  widthClass = "max-w-3xl",
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl",
          widthClass
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              {badge}
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
            aria-label="Fechar painel lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
