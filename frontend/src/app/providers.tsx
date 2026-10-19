"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import {
  CUSTOM_TENANTS_STORAGE_KEY,
  DEFAULT_MUNICIPALITIES,
  DEFAULT_TENANT_ID,
  getActiveTenantId,
  setActiveTenantId,
} from "@/services/api";
import { MunicipalityTenant } from "@/types/planning";

interface TenantContextValue {
  tenantId: string;
  activeMunicipality: MunicipalityTenant;
  municipalities: MunicipalityTenant[];
  switchTenant: (newTenantId: string, customName?: string) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [tenantId, setTenantIdState] = useState<string>(DEFAULT_TENANT_ID);
  const [customMunicipalities, setCustomMunicipalities] = useState<
    MunicipalityTenant[]
  >([]);

  useEffect(() => {
    const initialTenant = getActiveTenantId();
    setTenantIdState(initialTenant);
    setActiveTenantId(initialTenant);

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(CUSTOM_TENANTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as MunicipalityTenant[];
          if (Array.isArray(parsed)) {
            setCustomMunicipalities(parsed);
          }
        }
      } catch {
        // Ignora erro de parse no localStorage
      }
    }
  }, []);

  const municipalities = useMemo(() => {
    const all = [...DEFAULT_MUNICIPALITIES, ...customMunicipalities];
    if (!all.some((m) => m.id.toLowerCase() === tenantId.toLowerCase())) {
      all.push({
        id: tenantId,
        name: `Município (${tenantId.slice(0, 8)}...)`,
        state: "BR",
        ibgeCode: "Custom",
      });
    }
    return all;
  }, [customMunicipalities, tenantId]);

  const activeMunicipality = useMemo(() => {
    return (
      municipalities.find(
        (m) => m.id.toLowerCase() === tenantId.toLowerCase()
      ) || {
        id: tenantId,
        name: `Município (${tenantId.slice(0, 8)}...)`,
        state: "BR",
        ibgeCode: "Custom",
      }
    );
  }, [municipalities, tenantId]);

  const switchTenant = useCallback(
    (newTenantId: string, customName?: string) => {
      const normalized = newTenantId.trim();
      if (!normalized) return;

      setActiveTenantId(normalized);
      setTenantIdState(normalized);

      const existsInDefaults = DEFAULT_MUNICIPALITIES.some(
        (m) => m.id.toLowerCase() === normalized.toLowerCase()
      );
      const existsInCustom = customMunicipalities.some(
        (m) => m.id.toLowerCase() === normalized.toLowerCase()
      );

      if (!existsInDefaults && !existsInCustom) {
        const newEntry: MunicipalityTenant = {
          id: normalized,
          name:
            customName?.trim() ||
            `Ente Municipal (${normalized.slice(0, 8)}...)`,
          state: "BR",
          ibgeCode: "UUID",
        };
        const updated = [...customMunicipalities, newEntry];
        setCustomMunicipalities(updated);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            CUSTOM_TENANTS_STORAGE_KEY,
            JSON.stringify(updated)
          );
        }
      }

      // Invalida todas as queries ativas para recarregar os dados com o novo X-Tenant-ID
      queryClient.invalidateQueries();

      const targetName =
        customName ||
        municipalities.find(
          (m) => m.id.toLowerCase() === normalized.toLowerCase()
        )?.name ||
        normalized;

      toast.success(`Contexto municipal alterado`, {
        description: `${targetName} (X-Tenant-ID: ${normalized.slice(0, 8)}...)`,
      });
    },
    [customMunicipalities, municipalities, queryClient]
  );

  const contextValue = useMemo(
    () => ({
      tenantId,
      activeMunicipality,
      municipalities,
      switchTenant,
    }),
    [tenantId, activeMunicipality, municipalities, switchTenant]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={contextValue}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans text-sm",
          }}
        />
      </TenantContext.Provider>
    </QueryClientProvider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant deve ser utilizado dentro de <Providers />");
  }
  return ctx;
}
