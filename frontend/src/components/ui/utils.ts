import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ActionType, PPAStatus, ProgramType } from "@/types/planning";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyBRL(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumberBR(
  value: string | number | null | undefined,
  decimals = 2
): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export const PPA_STATUS_META: Record<
  PPAStatus,
  { label: string; badgeVariant: "warning" | "info" | "success" | "neutral" }
> = {
  ELABORACAO: { label: "Em Elaboração", badgeVariant: "warning" },
  APROVADO: { label: "Aprovado (Lei)", badgeVariant: "info" },
  EM_EXECUCAO: { label: "Em Execução", badgeVariant: "success" },
  ENCERRADO: { label: "Encerrado", badgeVariant: "neutral" },
};

export const PROGRAM_TYPE_META: Record<
  ProgramType,
  { label: string; shortLabel: string; badgeVariant: "primary" | "neutral" }
> = {
  TEMATICO: {
    label: "Programa Finalístico / Temático",
    shortLabel: "Temático",
    badgeVariant: "primary",
  },
  GESTAO_MANUTENCAO: {
    label: "Gestão, Manutenção e Serviços ao Estado",
    shortLabel: "Gestão e Manutenção",
    badgeVariant: "neutral",
  },
};

export const ACTION_TYPE_META: Record<
  ActionType,
  { label: string; prefixHint: string; badgeVariant: "info" | "success" | "warning" }
> = {
  PROJETO: {
    label: "Projeto (Expansão/Obra)",
    prefixHint: "1xxx",
    badgeVariant: "info",
  },
  ATIVIDADE: {
    label: "Atividade (Contínua)",
    prefixHint: "2xxx",
    badgeVariant: "success",
  },
  OPERACAO_ESPECIAL: {
    label: "Operação Especial",
    prefixHint: "0xxx",
    badgeVariant: "warning",
  },
};
