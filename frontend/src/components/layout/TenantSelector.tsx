"use client";

import React, { useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  KeyRound,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { tenantIdSchema } from "@/modules/planning/schemas/planning.schema";

export function TenantSelector() {
  const { tenantId, activeMunicipality, municipalities, switchTenant } =
    useTenant();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customUuid, setCustomUuid] = useState("");
  const [customName, setCustomName] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>();

  const handleCopyTenantId = async () => {
    try {
      await navigator.clipboard.writeText(tenantId);
      toast.info("X-Tenant-ID copiado para a área de transferência!", {
        description: tenantId,
      });
    } catch {
      toast.info(`X-Tenant-ID ativo: ${tenantId}`);
    }
  };

  const handleApplyCustomTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = tenantIdSchema.safeParse(customUuid);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message || "UUID inválido.");
      return;
    }

    setValidationError(undefined);
    switchTenant(parsed.data, customName || undefined);
    setCustomModalOpen(false);
    setDropdownOpen(false);
    setCustomUuid("");
    setCustomName("");
  };

  const handleGenerateRandomUuid = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      setCustomUuid(crypto.randomUUID());
      setValidationError(undefined);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-left transition-all hover:border-gov-300 hover:bg-gov-50/40 focus:outline-none focus:ring-2 focus:ring-gov-500/20"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gov-700 text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 line-clamp-1 max-w-[220px]">
                {activeMunicipality.name}
              </span>
              <span className="rounded bg-gov-100 px-1.5 py-0.2 text-[10px] font-bold text-gov-800">
                {activeMunicipality.state}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <span>X-Tenant-ID:</span>
              <span className="text-slate-700">
                {tenantId.slice(0, 8)}...{tenantId.slice(-4)}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={handleCopyTenantId}
          title={`Copiar X-Tenant-ID completo (${tenantId})`}
          className="flex h-10 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-40 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Seletor Multitenant (Município Ativo)
              </p>
              <p className="mt-0.5 text-[11px] font-mono text-slate-600 break-all">
                {tenantId}
              </p>
            </div>

            <div className="my-1.5 max-h-60 overflow-y-auto space-y-1">
              {municipalities.map((mun) => {
                const isSelected =
                  mun.id.toLowerCase() === tenantId.toLowerCase();
                return (
                  <button
                    key={mun.id}
                    type="button"
                    onClick={() => {
                      switchTenant(mun.id, mun.name);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-start justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-gov-50/90 text-gov-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="pr-2">
                      <p className="font-medium text-slate-900">{mun.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {mun.id}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-gov-700 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setCustomUuid(tenantId);
                  setCustomModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gov-700 hover:bg-gov-50 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Informar ou Gerar outro Tenant ID (UUID)
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Configurar Contexto Multitenant (X-Tenant-ID)"
        description="Informe o identificador UUID do município. Todas as requisições à API FastAPI incluirão automaticamente este cabeçalho X-Tenant-ID."
      >
        <form onSubmit={handleApplyCustomTenant} className="space-y-4">
          <div className="space-y-2">
            <Input
              label="UUID do Município (X-Tenant-ID)"
              placeholder="Ex.: 11111111-2222-3333-4444-555555555555"
              value={customUuid}
              onChange={(e) => {
                setCustomUuid(e.target.value);
                setValidationError(undefined);
              }}
              error={validationError}
              className="font-mono text-xs"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateRandomUuid}
                className="inline-flex items-center gap-1 text-xs font-medium text-gov-700 hover:text-gov-800 hover:underline"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Gerar novo UUID v4 aleatório
              </button>
            </div>
          </div>

          <Input
            label="Identificação do Município / Órgão (Opcional)"
            placeholder="Ex.: Prefeitura Municipal de Ouro Verde - SP"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            helperText="Rótulo salvo localmente para facilitar a alternância no seletor superior."
          />

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Aplicar Tenant ID
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
