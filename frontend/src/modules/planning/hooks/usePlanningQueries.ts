"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/app/providers";
import { extractApiErrorMessage } from "@/services/api";
import { planningService } from "@/services/planning.service";
import {
  GovernmentActionCreateInput,
  GovernmentProgramCreateInput,
  GovernmentProgramDetail,
  GovernmentProgramFilterParams,
  GovernmentProgramUpdateInput,
  IndicatorCreateInput,
  PPACreateInput,
  PPADetail,
  PPAFilterParams,
  PPAUpdateInput,
  StrategicAxisCreateInput,
  StrategicObjectiveCreateInput,
} from "@/types/planning";

// ============================================================================
// Queries de PPA e Árvore Completa de Planejamento
// ============================================================================
export function usePPAsQuery(filters?: PPAFilterParams) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["ppas", tenantId, filters],
    queryFn: () => planningService.listPPAs(filters),
    enabled: Boolean(tenantId),
  });
}

export function usePPADetailQuery(ppaId: string | null) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["ppa-detail", tenantId, ppaId],
    queryFn: () => planningService.getPPADetail(ppaId as string),
    enabled: Boolean(tenantId && ppaId),
  });
}

/**
 * Carrega a árvore completa de um ciclo de PPA:
 * - Detalhes do PPA + Eixos Estratégicos + Objetivos Estratégicos
 * - Todos os Programas Governamentais do PPA detalhados com Indicadores, Ações e Metas Anuais
 */
export function useFullPPATreeQuery(ppaId: string | null) {
  const { tenantId } = useTenant();
  return useQuery<{
    ppa: PPADetail;
    programs: GovernmentProgramDetail[];
  }>({
    queryKey: ["ppa-full-tree", tenantId, ppaId],
    enabled: Boolean(tenantId && ppaId),
    queryFn: async () => {
      const [ppaDetail, programsPage] = await Promise.all([
        planningService.getPPADetail(ppaId as string),
        planningService.listPrograms({ ppa_id: ppaId as string, limit: 100 }),
      ]);

      const detailedPrograms = await Promise.all(
        programsPage.items.map((prog) =>
          planningService.getProgramDetail(prog.id)
        )
      );

      return {
        ppa: ppaDetail,
        programs: detailedPrograms,
      };
    },
  });
}

// ============================================================================
// Queries de Programas Governamentais
// ============================================================================
export function useProgramsQuery(filters?: GovernmentProgramFilterParams) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["programs", tenantId, filters],
    queryFn: () => planningService.listPrograms(filters),
    enabled: Boolean(tenantId),
  });
}

export function useProgramDetailQuery(programId: string | null) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["program-detail", tenantId, programId],
    queryFn: () => planningService.getProgramDetail(programId as string),
    enabled: Boolean(tenantId && programId),
  });
}

// ============================================================================
// Mutations de PPA, Eixos e Objetivos
// ============================================================================
export function useCreatePPAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PPACreateInput) => planningService.createPPA(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["ppas"] });
      toast.success("Ciclo do PPA criado com sucesso!", {
        description: `${created.name} (${created.start_year}-${created.end_year})`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar PPA", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useUpdatePPAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ppaId,
      payload,
    }: {
      ppaId: string;
      payload: PPAUpdateInput;
    }) => planningService.updatePPA(ppaId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["ppas"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Ciclo do PPA atualizado!", {
        description: `${updated.name} — Status: ${updated.status}`,
      });
    },
    onError: (err) => {
      toast.error("Não foi possível atualizar o PPA", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useDeletePPAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ppaId: string) => planningService.deletePPA(ppaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppas"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Ciclo de PPA excluído com sucesso.");
    },
    onError: (err) => {
      toast.error("Erro ao excluir PPA", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useCreateAxisMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StrategicAxisCreateInput) =>
      planningService.createStrategicAxis(payload),
    onSuccess: (axis) => {
      queryClient.invalidateQueries({ queryKey: ["ppa-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Eixo Estratégico cadastrado!", {
        description: `${axis.code} — ${axis.name}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao criar Eixo Estratégico", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useCreateObjectiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StrategicObjectiveCreateInput) =>
      planningService.createStrategicObjective(payload),
    onSuccess: (obj) => {
      queryClient.invalidateQueries({ queryKey: ["ppa-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Objetivo Estratégico cadastrado!", {
        description: `${obj.code} — ${obj.title}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao criar Objetivo Estratégico", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

// ============================================================================
// Mutations de Programas, Indicadores e Ações
// ============================================================================
export function useCreateProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GovernmentProgramCreateInput) =>
      planningService.createProgram(payload),
    onSuccess: (prog) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Programa Governamental criado!", {
        description: `${prog.code} — ${prog.title}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar Programa Governamental", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useUpdateProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      payload,
    }: {
      programId: string;
      payload: GovernmentProgramUpdateInput;
    }) => planningService.updateProgram(programId, payload),
    onSuccess: (prog) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Programa Governamental atualizado!", {
        description: `${prog.code} — ${prog.title}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao atualizar Programa", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => planningService.deleteProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Programa Governamental removido.");
    },
    onError: (err) => {
      toast.error("Não foi possível excluir o Programa", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useAddIndicatorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IndicatorCreateInput) =>
      planningService.addIndicator(payload),
    onSuccess: (ind) => {
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Indicador vinculado ao Programa!", {
        description: `${ind.code} — ${ind.name}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao adicionar Indicador", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}

export function useAddActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GovernmentActionCreateInput) =>
      planningService.addAction(payload),
    onSuccess: (act) => {
      queryClient.invalidateQueries({ queryKey: ["program-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ppa-full-tree"] });
      toast.success("Ação Governamental e Metas cadastradas!", {
        description: `${act.code} — ${act.title}`,
      });
    },
    onError: (err) => {
      toast.error("Erro ao adicionar Ação Governamental", {
        description: extractApiErrorMessage(err),
      });
    },
  });
}
