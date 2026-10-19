"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-xl",
}: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
          maxWidthClass
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold text-slate-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
