import { api } from "@/services/api";
import {
  GovernmentAction,
  GovernmentActionCreateInput,
  GovernmentProgram,
  GovernmentProgramCreateInput,
  GovernmentProgramDetail,
  GovernmentProgramFilterParams,
  GovernmentProgramUpdateInput,
  Indicator,
  IndicatorCreateInput,
  PaginatedResponse,
  PPA,
  PPACreateInput,
  PPADetail,
  PPAFilterParams,
  PPAUpdateInput,
  StrategicAxis,
  StrategicAxisCreateInput,
  StrategicObjective,
  StrategicObjectiveCreateInput,
} from "@/types/planning";

export const planningService = {
  // ==========================================================================
  // Ciclos de PPA (/planning/ppas)
  // ==========================================================================
  async listPPAs(params?: PPAFilterParams): Promise<PaginatedResponse<PPA>> {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );
    const { data } = await api.get<PaginatedResponse<PPA>>("/planning/ppas", {
      params: cleanParams,
    });
    return data;
  },

  async getPPADetail(ppaId: string): Promise<PPADetail> {
    const { data } = await api.get<PPADetail>(`/planning/ppas/${ppaId}`);
    return data;
  },

  async createPPA(payload: PPACreateInput): Promise<PPA> {
    const { data } = await api.post<PPA>("/planning/ppas", payload);
    return data;
  },

  async updatePPA(ppaId: string, payload: PPAUpdateInput): Promise<PPA> {
    const { data } = await api.patch<PPA>(`/planning/ppas/${ppaId}`, payload);
    return data;
  },

  async deletePPA(ppaId: string): Promise<void> {
    await api.delete(`/planning/ppas/${ppaId}`);
  },

  // ==========================================================================
  // Eixos e Objetivos Estratégicos (/planning/ppas/axes & /objectives)
  // ==========================================================================
  async createStrategicAxis(
    payload: StrategicAxisCreateInput
  ): Promise<StrategicAxis> {
    const { data } = await api.post<StrategicAxis>(
      "/planning/ppas/axes",
      payload
    );
    return data;
  },

  async createStrategicObjective(
    payload: StrategicObjectiveCreateInput
  ): Promise<StrategicObjective> {
    const { data } = await api.post<StrategicObjective>(
      "/planning/ppas/objectives",
      payload
    );
    return data;
  },

  // ==========================================================================
  // Programas Governamentais (/planning/programs)
  // ==========================================================================
  async listPrograms(
    params?: GovernmentProgramFilterParams
  ): Promise<PaginatedResponse<GovernmentProgram>> {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );
    const { data } = await api.get<PaginatedResponse<GovernmentProgram>>(
      "/planning/programs",
      { params: cleanParams }
    );
    return data;
  },

  async getProgramDetail(programId: string): Promise<GovernmentProgramDetail> {
    const { data } = await api.get<GovernmentProgramDetail>(
      `/planning/programs/${programId}`
    );
    return data;
  },

  async createProgram(
    payload: GovernmentProgramCreateInput
  ): Promise<GovernmentProgramDetail> {
    const { data } = await api.post<GovernmentProgramDetail>(
      "/planning/programs",
      payload
    );
    return data;
  },

  async updateProgram(
    programId: string,
    payload: GovernmentProgramUpdateInput
  ): Promise<GovernmentProgramDetail> {
    const { data } = await api.patch<GovernmentProgramDetail>(
      `/planning/programs/${programId}`,
      payload
    );
    return data;
  },

  async deleteProgram(programId: string): Promise<void> {
    await api.delete(`/planning/programs/${programId}`);
  },

  // ==========================================================================
  // Indicadores e Ações Governamentais (/planning/programs/indicators & /actions)
  // ==========================================================================
  async addIndicator(payload: IndicatorCreateInput): Promise<Indicator> {
    const { data } = await api.post<Indicator>(
      "/planning/programs/indicators",
      payload
    );
    return data;
  },

  async addAction(
    payload: GovernmentActionCreateInput
  ): Promise<GovernmentAction> {
    const { data } = await api.post<GovernmentAction>(
      "/planning/programs/actions",
      payload
    );
    return data;
  },
};
