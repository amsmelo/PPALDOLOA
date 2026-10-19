import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const tenantIdSchema = z
  .string()
  .trim()
  .regex(uuidRegex, "Informe um UUID válido (ex.: 11111111-2222-3333-4444-555555555555).");

/**
 * Schema Zod para criação e edição de Ciclo de PPA.
 * Espelha as invariantes do PPACreate/PPAUpdate no Pydantic v2:
 * 1. Vigência quadrienal obrigatória: end_year === start_year + 3
 * 2. Lei Municipal obrigatória caso status seja APROVADO ou EM_EXECUCAO
 */
export const ppaFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "O nome do PPA deve ter pelo menos 3 caracteres.")
      .max(150, "O nome do PPA deve ter no máximo 150 caracteres."),
    start_year: z.coerce
      .number({ invalid_type_error: "Informe um ano inicial válido." })
      .int("O ano inicial deve ser um número inteiro.")
      .min(2000, "O ano inicial deve ser maior ou igual a 2000.")
      .max(2100, "O ano inicial deve ser menor ou igual a 2100."),
    end_year: z.coerce
      .number({ invalid_type_error: "Informe um ano de término válido." })
      .int("O ano final deve ser um número inteiro.")
      .min(2003, "O ano final deve ser maior ou igual a 2003.")
      .max(2103, "O ano final deve ser menor ou igual a 2103."),
    status: z.enum(["ELABORACAO", "APROVADO", "EM_EXECUCAO", "ENCERRADO"]),
    law_number: z
      .string()
      .trim()
      .max(60, "Máximo de 60 caracteres.")
      .optional()
      .or(z.literal("")),
    law_date: z.string().optional().or(z.literal("")),
    description: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.end_year === data.start_year + 3, {
    message:
      "Vigência quadrienal inválida: o ano final deve ser exatamente igual ao ano inicial + 3 (4 exercícios).",
    path: ["end_year"],
  })
  .refine(
    (data) => {
      if (data.status === "APROVADO" || data.status === "EM_EXECUCAO") {
        return Boolean(data.law_number && data.law_number.trim().length > 0);
      }
      return true;
    },
    {
      message:
        "Para status Aprovado ou Em Execução, o número da Lei Municipal é obrigatório.",
      path: ["law_number"],
    }
  );

export type PPAFormValues = z.infer<typeof ppaFormSchema>;

/**
 * Schema para criação de Eixo Estratégico
 */
export const strategicAxisFormSchema = z.object({
  ppa_id: z.string().min(1, "Selecione o PPA."),
  code: z
    .string()
    .trim()
    .min(1, "Informe o código do eixo (ex.: EIXO-01).")
    .max(20, "Máximo de 20 caracteres."),
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome do Eixo Estratégico.")
    .max(200, "Máximo de 200 caracteres."),
  description: z.string().trim().optional().or(z.literal("")),
});

export type StrategicAxisFormValues = z.infer<typeof strategicAxisFormSchema>;

/**
 * Schema para criação de Objetivo Estratégico
 */
export const strategicObjectiveFormSchema = z.object({
  axis_id: z.string().min(1, "Selecione o Eixo Estratégico."),
  code: z
    .string()
    .trim()
    .min(1, "Informe o código do objetivo (ex.: OBJ-01.01).")
    .max(20, "Máximo de 20 caracteres."),
  title: z
    .string()
    .trim()
    .min(3, "Informe o enunciado do Objetivo Estratégico.")
    .max(250, "Máximo de 250 caracteres."),
  description: z.string().trim().optional().or(z.literal("")),
});

export type StrategicObjectiveFormValues = z.infer<
  typeof strategicObjectiveFormSchema
>;

/**
 * Schema para criação e edição de Programa Governamental
 */
export const programFormSchema = z.object({
  ppa_id: z.string().min(1, "Selecione o ciclo do PPA."),
  objective_id: z.string().optional().or(z.literal("")),
  code: z
    .string()
    .trim()
    .min(1, "Informe o código do programa (ex.: 0010).")
    .max(10, "O código deve ter no máximo 10 caracteres."),
  title: z
    .string()
    .trim()
    .min(3, "O título deve ter pelo menos 3 caracteres.")
    .max(250, "O título deve ter no máximo 250 caracteres."),
  program_type: z.enum(["TEMATICO", "GESTAO_MANUTENCAO"]),
  responsible_unit: z
    .string()
    .trim()
    .min(3, "Informe a Secretaria ou Unidade Responsável.")
    .max(150, "Máximo de 150 caracteres."),
  target_audience: z
    .string()
    .trim()
    .min(3, "Informe o público-alvo beneficiado pelo programa.")
    .max(250, "Máximo de 250 caracteres."),
  justification: z
    .string()
    .trim()
    .min(5, "Descreva a justificativa / diagnóstico do programa (mín. 5 caracteres)."),
  is_active: z.boolean().default(true),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

/**
 * Schema para adição de Indicador de Desempenho a um Programa
 */
export const indicatorFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe o código do indicador (ex.: IND-EDU-01).")
    .max(30, "Máximo de 30 caracteres."),
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome do indicador.")
    .max(200, "Máximo de 200 caracteres."),
  unit_of_measure: z
    .string()
    .trim()
    .min(1, "Informe a unidade de medida (ex.: Percentual %).")
    .max(50, "Máximo de 50 caracteres."),
  formula: z
    .string()
    .trim()
    .min(3, "Descreva a fórmula de cálculo do indicador."),
  periodicity: z.enum([
    "MENSAL",
    "BIMESTRAL",
    "QUADRIMESTRAL",
    "SEMESTRAL",
    "ANUAL",
  ]),
  baseline_value: z.coerce
    .number({ invalid_type_error: "Valor numérico inválido." })
    .min(0, "O valor de linha de base não pode ser negativo."),
  target_value: z.coerce
    .number({ invalid_type_error: "Valor numérico inválido." })
    .min(0, "A meta esperada não pode ser negativa."),
  is_cumulative: z.boolean().default(false),
});

export type IndicatorFormValues = z.infer<typeof indicatorFormSchema>;

/**
 * Schema para adição de Ação Governamental + Metas Anuais (4 anos do PPA)
 */
export const targetItemSchema = z.object({
  year: z.coerce.number().int(),
  physical_target: z.coerce
    .number({ invalid_type_error: "Meta física inválida." })
    .min(0, "Não pode ser negativa."),
  financial_target: z.coerce
    .number({ invalid_type_error: "Meta financeira inválida." })
    .min(0, "Não pode ser negativa."),
});

export const actionFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe o código da ação (ex.: 1001, 2001).")
    .max(10, "Máximo de 10 caracteres."),
  title: z
    .string()
    .trim()
    .min(3, "Informe o título oficial da ação.")
    .max(250, "Máximo de 250 caracteres."),
  action_type: z.enum(["PROJETO", "ATIVIDADE", "OPERACAO_ESPECIAL"]),
  responsible_unit_code: z
    .string()
    .trim()
    .min(1, "Informe o código da U.O. (ex.: 02.05.01).")
    .max(30, "Máximo de 30 caracteres."),
  responsible_unit_name: z
    .string()
    .trim()
    .min(3, "Informe o nome da Secretaria / Unidade Orçamentária.")
    .max(180, "Máximo de 180 caracteres."),
  function_code: z
    .string()
    .trim()
    .min(1, "Ex.: 12 (Educação), 10 (Saúde).")
    .max(4, "Máximo de 4 dígitos."),
  subfunction_code: z
    .string()
    .trim()
    .min(1, "Ex.: 361, 301.")
    .max(4, "Máximo de 4 dígitos."),
  product_name: z
    .string()
    .trim()
    .min(2, "Informe o produto entregue (ex.: Escola Reformada).")
    .max(150, "Máximo de 150 caracteres."),
  unit_of_measure: z
    .string()
    .trim()
    .min(1, "Informe a unidade física (ex.: Unidade, Aluno, m²).")
    .max(50, "Máximo de 50 caracteres."),
  description: z.string().trim().optional().or(z.literal("")),
  targets: z.array(targetItemSchema).min(1, "Informe ao menos uma meta anual."),
});

export type ActionFormValues = z.infer<typeof actionFormSchema>;
