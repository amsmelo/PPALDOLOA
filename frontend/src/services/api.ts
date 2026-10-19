import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { MunicipalityTenant } from "@/types/planning";

export const TENANT_STORAGE_KEY = "govtech_active_tenant_id";
export const CUSTOM_TENANTS_STORAGE_KEY = "govtech_custom_tenants";

export const DEFAULT_MUNICIPALITIES: MunicipalityTenant[] = [
  {
    id: "11111111-2222-3333-4444-555555555555",
    name: "Prefeitura Municipal de São Bento do Vale",
    state: "SC",
    ibgeCode: "4215802",
    populationEstimate: "28.450 hab.",
  },
  {
    id: "22222222-3333-4444-5555-666666666666",
    name: "Prefeitura Municipal de Santa Luzia da Serra",
    state: "MG",
    ibgeCode: "3157807",
    populationEstimate: "19.120 hab.",
  },
  {
    id: "33333333-4444-5555-6666-777777777777",
    name: "Prefeitura Municipal de Vila Nova do Norte",
    state: "PR",
    ibgeCode: "4128609",
    populationEstimate: "14.800 hab.",
  },
];

export const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || DEFAULT_MUNICIPALITIES[0].id;

let currentTenantIdMemory: string = DEFAULT_TENANT_ID;

export function getActiveTenantId(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TENANT_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      currentTenantIdMemory = stored.trim();
      return currentTenantIdMemory;
    }
  }
  return currentTenantIdMemory;
}

export function setActiveTenantId(tenantId: string): void {
  currentTenantIdMemory = tenantId.trim();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TENANT_STORAGE_KEY, currentTenantIdMemory);
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor de Requisição: Injeta automaticamente o cabeçalho X-Tenant-ID
 * em todas as chamadas HTTP destinadas ao backend FastAPI.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tenantId = getActiveTenantId();
    if (tenantId) {
      config.headers.set("X-Tenant-ID", tenantId);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Utilitário para extrair mensagens de erro legíveis do padrão FastAPI / Pydantic v2.
 */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{
      detail?: string | Array<{ loc?: (string | number)[]; msg?: string }>;
      error?: string;
    }>;

    if (!axiosErr.response) {
      return `Não foi possível conectar à API (${API_BASE_URL}). Verifique se o servidor FastAPI está em execução.`;
    }

    const detail = axiosErr.response.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((err) => {
          const field = err.loc ? err.loc[err.loc.length - 1] : "campo";
          return `${field}: ${err.msg}`;
        })
        .join(" | ");
    }
    return `Erro HTTP ${axiosErr.response.status}: Solicitação não pôde ser processada.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado ao comunicar com o servidor.";
}
