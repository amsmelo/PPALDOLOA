/**
 * Tipagens TypeScript espelhadas diretamente dos Schemas Pydantic v2 (OpenAPI) do Backend FastAPI.
 */

export type PPAStatus = "ELABORACAO" | "APROVADO" | "EM_EXECUCAO" | "ENCERRADO";

export type ProgramType = "TEMATICO" | "GESTAO_MANUTENCAO";

export type ActionType = "PROJETO" | "ATIVIDADE" | "OPERACAO_ESPECIAL";

export type IndicatorPeriodicity =
  | "MENSAL"
  | "BIMESTRAL"
  | "QUADRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

export type LDOStatus = "ELABORACAO" | "APROVADA" | "EM_EXECUCAO" | "ENCERRADA";

export interface TenantAuditEntity {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================================================
// Eixos e Objetivos Estratégicos
// ============================================================================
export interface StrategicObjective extends TenantAuditEntity {
  axis_id: string;
  code: string;
  title: string;
  description?: string | null;
}

export interface StrategicObjectiveCreateInput {
  axis_id: string;
  code: string;
  title: string;
  description?: string | null;
}

export interface StrategicAxis extends TenantAuditEntity {
  ppa_id: string;
  code: string;
  name: string;
  description?: string | null;
  objectives: StrategicObjective[];
}

export interface StrategicAxisCreateInput {
  ppa_id: string;
  code: string;
  name: string;
  description?: string | null;
}

// ============================================================================
// PPA (Plano Plurianual Quadrienal)
// ============================================================================
export interface PPA extends TenantAuditEntity {
  name: string;
  start_year: number;
  end_year: number;
  status: PPAStatus;
  law_number?: string | null;
  law_date?: string | null;
  description?: string | null;
}

export interface PPADetail extends PPA {
  strategic_axes: StrategicAxis[];
}

export interface PPACreateInput {
  name: string;
  start_year: number;
  end_year: number;
  status?: PPAStatus;
  law_number?: string | null;
  law_date?: string | null;
  description?: string | null;
}

export interface PPAUpdateInput {
  name?: string;
  start_year?: number;
  end_year?: number;
  status?: PPAStatus;
  law_number?: string | null;
  law_date?: string | null;
  description?: string | null;
}

export interface PPAFilterParams {
  status?: PPAStatus | "";
  reference_year?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

// ============================================================================
// Metas Físicas e Financeiras (Target)
// ============================================================================
export interface Target extends TenantAuditEntity {
  action_id: string;
  year: number;
  physical_target: string | number;
  financial_target: string | number;
  executed_physical: string | number;
  executed_financial: string | number;
  notes?: string | null;
}

export interface TargetNestedInput {
  year: number;
  physical_target: string | number;
  financial_target: string | number;
  executed_physical?: string | number;
  executed_financial?: string | number;
  notes?: string | null;
}

// ============================================================================
// Ações Governamentais (Projeto, Atividade, Operação Especial)
// ============================================================================
export interface GovernmentAction extends TenantAuditEntity {
  program_id: string;
  code: string;
  title: string;
  description?: string | null;
  action_type: ActionType;
  responsible_unit_code: string;
  responsible_unit_name: string;
  function_code: string;
  subfunction_code: string;
  product_name: string;
  unit_of_measure: string;
  is_active: boolean;
  targets: Target[];
}

export interface GovernmentActionCreateInput {
  program_id: string;
  code: string;
  title: string;
  description?: string | null;
  action_type: ActionType;
  responsible_unit_code: string;
  responsible_unit_name: string;
  function_code: string;
  subfunction_code: string;
  product_name: string;
  unit_of_measure: string;
  is_active?: boolean;
  targets?: TargetNestedInput[];
}

// ============================================================================
// Indicadores de Programa (Indicator)
// ============================================================================
export interface Indicator extends TenantAuditEntity {
  program_id: string;
  code: string;
  name: string;
  unit_of_measure: string;
  formula: string;
  periodicity: IndicatorPeriodicity;
  baseline_value: string | number;
  baseline_date?: string | null;
  target_value: string | number;
  is_cumulative: boolean;
}

export interface IndicatorCreateInput {
  program_id: string;
  code: string;
  name: string;
  unit_of_measure: string;
  formula: string;
  periodicity: IndicatorPeriodicity;
  baseline_value: string | number;
  baseline_date?: string | null;
  target_value: string | number;
  is_cumulative: boolean;
}

// ============================================================================
// Programas Governamentais (GovernmentProgram)
// ============================================================================
export interface GovernmentProgram extends TenantAuditEntity {
  ppa_id: string;
  objective_id?: string | null;
  code: string;
  title: string;
  justification: string;
  target_audience: string;
  program_type: ProgramType;
  responsible_unit: string;
  is_active: boolean;
}

export interface GovernmentProgramDetail extends GovernmentProgram {
  indicators: Indicator[];
  actions: GovernmentAction[];
}

export interface GovernmentProgramCreateInput {
  ppa_id: string;
  objective_id?: string | null;
  code: string;
  title: string;
  justification: string;
  target_audience: string;
  program_type: ProgramType;
  responsible_unit: string;
  is_active?: boolean;
  indicators?: Omit<IndicatorCreateInput, "program_id">[];
  actions?: Omit<GovernmentActionCreateInput, "program_id">[];
}

export interface GovernmentProgramUpdateInput {
  objective_id?: string | null;
  code?: string;
  title?: string;
  justification?: string;
  target_audience?: string;
  program_type?: ProgramType;
  responsible_unit?: string;
  is_active?: boolean;
}

export interface GovernmentProgramFilterParams {
  ppa_id?: string;
  objective_id?: string;
  program_type?: ProgramType | "";
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

// ============================================================================
// LDO (Lei de Diretrizes Orçamentárias)
// ============================================================================
export interface LDOItem extends TenantAuditEntity {
  ldo_id: string;
  action_id: string;
  priority_level: number;
  adjusted_physical_target: string | number;
  adjusted_financial_target: string | number;
  justification?: string | null;
}

export interface LDO extends TenantAuditEntity {
  ppa_id: string;
  fiscal_year: number;
  status: LDOStatus;
  law_number?: string | null;
  law_date?: string | null;
  primary_result_target: string | number;
  nominal_result_target: string | number;
  notes?: string | null;
  items: LDOItem[];
}

// ============================================================================
// Município (Tenant) para o Tenant Switcher
// ============================================================================
export interface MunicipalityTenant {
  id: string;
  name: string;
  state: string;
  ibgeCode: string;
  populationEstimate?: string;
}
