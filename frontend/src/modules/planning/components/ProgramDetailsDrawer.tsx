"use client";

import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Gauge,
  Hammer,
  Info,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import {
  ACTION_TYPE_META,
  formatCurrencyBRL,
  formatNumberBR,
  PROGRAM_TYPE_META,
} from "@/components/ui/utils";
import {
  useAddActionMutation,
  useAddIndicatorMutation,
  usePPADetailQuery,
  useProgramDetailQuery,
} from "@/modules/planning/hooks/usePlanningQueries";
import {
  actionFormSchema,
  ActionFormValues,
  indicatorFormSchema,
  IndicatorFormValues,
} from "@/modules/planning/schemas/planning.schema";

export interface ProgramDetailsDrawerProps {
  programId: string | null;
  onClose: () => void;
}

export function ProgramDetailsDrawer({
  programId,
  onClose,
}: ProgramDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"actions" | "indicators">(
    "actions"
  );
  const [showAddActionForm, setShowAddActionForm] = useState(false);
  const [showAddIndicatorForm, setShowAddIndicatorForm] = useState(false);

  const { data: program, isLoading } = useProgramDetailQuery(programId);
  const { data: ppa } = usePPADetailQuery(program?.ppa_id || null);

  const startYear = ppa?.start_year || 2026;
  const ppaYears = [startYear, startYear + 1, startYear + 2, startYear + 3];

  const addActionMutation = useAddActionMutation();
  const addIndicatorMutation = useAddIndicatorMutation();

  // Formulário de Nova Ação Governamental + Metas dos 4 anos
  const {
    register: regAction,
    control: controlAction,
    handleSubmit: handleActionSubmit,
    reset: resetActionForm,
    formState: { errors: actionErrors },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      code: "1001",
      title: "",
      action_type: "PROJETO",
      responsible_unit_code: "02.05.01",
      responsible_unit_name: program?.responsible_unit || "",
      function_code: "12",
      subfunction_code: "361",
      product_name: "",
      unit_of_measure: "Unidade",
      description: "",
      targets: ppaYears.map((yr) => ({
        year: yr,
        physical_target: 1,
        financial_target: 100000,
      })),
    },
  });

  const { fields: targetFields } = useFieldArray({
    control: controlAction,
    name: "targets",
  });

  useEffect(() => {
    if (program && ppa) {
      const years = [
        ppa.start_year,
        ppa.start_year + 1,
        ppa.start_year + 2,
        ppa.start_year + 3,
      ];
      resetActionForm({
        code: "1001",
        title: "",
        action_type: "PROJETO",
        responsible_unit_code: "02.05.01",
        responsible_unit_name: program.responsible_unit,
        function_code: "12",
        subfunction_code: "361",
        product_name: "",
        unit_of_measure: "Unidade",
        description: "",
        targets: years.map((yr) => ({
          year: yr,
          physical_target: 1,
          financial_target: 100000,
        })),
      });
    }
  }, [program, ppa, showAddActionForm, resetActionForm]);

  // Formulário de Novo Indicador
  const {
    register: regInd,
    handleSubmit: handleIndSubmit,
    reset: resetIndForm,
    formState: { errors: indErrors },
  } = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorFormSchema),
    defaultValues: {
      code: "IND-01",
      name: "",
      unit_of_measure: "Percentual (%)",
      formula: "",
      periodicity: "ANUAL",
      baseline_value: 0,
      target_value: 100,
      is_cumulative: false,
    },
  });

  const onSubmitNewAction = async (values: ActionFormValues) => {
    if (!program) return;
    await addActionMutation.mutateAsync({
      program_id: program.id,
      code: values.code,
      title: values.title,
      action_type: values.action_type,
      responsible_unit_code: values.responsible_unit_code,
      responsible_unit_name: values.responsible_unit_name,
      function_code: values.function_code,
      subfunction_code: values.subfunction_code,
      product_name: values.product_name,
      unit_of_measure: values.unit_of_measure,
      description: values.description || null,
      is_active: true,
      targets: values.targets,
    });
    setShowAddActionForm(false);
  };

  const onSubmitNewIndicator = async (values: IndicatorFormValues) => {
    if (!program) return;
    await addIndicatorMutation.mutateAsync({
      program_id: program.id,
      code: values.code,
      name: values.name,
      unit_of_measure: values.unit_of_measure,
      formula: values.formula,
      periodicity: values.periodicity,
      baseline_value: values.baseline_value,
      target_value: values.target_value,
      is_cumulative: values.is_cumulative,
    });
    resetIndForm();
    setShowAddIndicatorForm(false);
  };

  return (
    <Drawer
      isOpen={Boolean(programId)}
      onClose={onClose}
      title={
        program
          ? `Programa ${program.code} — ${program.title}`
          : "Carregando Programa Governamental..."
      }
      subtitle={
        program
          ? `Unidade Responsável: ${program.responsible_unit}`
          : undefined
      }
      badge={
        program ? (
          <Badge
            variant={PROGRAM_TYPE_META[program.program_type].badgeVariant}
          >
            {PROGRAM_TYPE_META[program.program_type].shortLabel}
          </Badge>
        ) : undefined
      }
      widthClass="max-w-3xl"
    >
      {isLoading || !program ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumo Diagnóstico do Programa */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-gov-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">
                  Justificativa / Diagnóstico:
                </span>{" "}
                <span className="text-slate-600">{program.justification}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4 text-gov-700 shrink-0" />
              <span>
                <strong className="text-slate-900">Público-Alvo:</strong>{" "}
                {program.target_audience}
              </span>
            </div>
          </div>

          {/* Abas de Navegação do Drawer */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("actions")}
                className={`flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition-colors ${
                  activeTab === "actions"
                    ? "border-gov-700 text-gov-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Hammer className="h-4 w-4" />
                Ações Governamentais & Metas ({program.actions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("indicators")}
                className={`flex items-center gap-2 border-b-2 pb-3 text-xs font-bold transition-colors ${
                  activeTab === "indicators"
                    ? "border-gov-700 text-gov-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Gauge className="h-4 w-4" />
                Indicadores de Desempenho ({program.indicators.length})
              </button>
            </div>
          </div>

          {/* ABA 1: AÇÕES GOVERNAMENTAIS E METAS DOS 4 ANOS */}
          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Projetos, Atividades e Operações Especiais vinculadas ao
                  programa com metas físicas e financeiras para o quadriênio.
                </p>
                <Button
                  size="sm"
                  variant={showAddActionForm ? "outline" : "primary"}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setShowAddActionForm((prev) => !prev)}
                >
                  {showAddActionForm ? "Fechar Formulário" : "Nova Ação & Metas"}
                </Button>
              </div>

              {showAddActionForm && (
                <form
                  onSubmit={handleActionSubmit(onSubmitNewAction)}
                  className="rounded-xl border border-gov-200 bg-gov-50/30 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gov-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gov-900">
                      Cadastrar Nova Ação Governamental + Metas Anuais
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input
                      label="Código Ação *"
                      placeholder="1001"
                      error={actionErrors.code?.message}
                      {...regAction("code")}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Título da Ação *"
                        placeholder="Ex.: Construção de Creche Municipal"
                        error={actionErrors.title?.message}
                        {...regAction("title")}
                      />
                    </div>
                    <Select
                      label="Tipo de Ação *"
                      options={[
                        { value: "PROJETO", label: "Projeto (1xxx)" },
                        { value: "ATIVIDADE", label: "Atividade (2xxx)" },
                        {
                          value: "OPERACAO_ESPECIAL",
                          label: "Operação Especial (0xxx)",
                        },
                      ]}
                      error={actionErrors.action_type?.message}
                      {...regAction("action_type")}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input
                      label="Cód. Unidade Orç. *"
                      placeholder="02.05.01"
                      error={actionErrors.responsible_unit_code?.message}
                      {...regAction("responsible_unit_code")}
                    />
                    <div className="sm:col-span-3">
                      <Input
                        label="Nome da Unidade Orçamentária / Secretaria *"
                        placeholder="Secretaria Municipal de Educação"
                        error={actionErrors.responsible_unit_name?.message}
                        {...regAction("responsible_unit_name")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      label="Função (MOG) *"
                      placeholder="12"
                      error={actionErrors.function_code?.message}
                      {...regAction("function_code")}
                    />
                    <Input
                      label="Subfunção *"
                      placeholder="365"
                      error={actionErrors.subfunction_code?.message}
                      {...regAction("subfunction_code")}
                    />
                    <Input
                      label="Produto Entregue *"
                      placeholder="Creche Construída"
                      error={actionErrors.product_name?.message}
                      {...regAction("product_name")}
                    />
                    <Input
                      label="Unid. Medida *"
                      placeholder="Unidade"
                      error={actionErrors.unit_of_measure?.message}
                      {...regAction("unit_of_measure")}
                    />
                  </div>

                  {/* Programação Física e Financeira para os 4 anos do PPA */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      Metas Físicas e Financeiras Anuais (Quadriênio{" "}
                      {ppaYears[0]}-{ppaYears[3]})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {targetFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gov-800">
                              Exercício {ppaYears[index] ?? field.year}
                            </span>
                            <input
                              type="hidden"
                              value={ppaYears[index] ?? field.year}
                              {...regAction(`targets.${index}.year`)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              label="Meta Física"
                              error={
                                actionErrors.targets?.[index]?.physical_target
                                  ?.message
                              }
                              {...regAction(`targets.${index}.physical_target`)}
                            />
                            <Input
                              type="number"
                              step="0.01"
                              label="Meta Financeira (R$)"
                              error={
                                actionErrors.targets?.[index]?.financial_target
                                  ?.message
                              }
                              {...regAction(
                                `targets.${index}.financial_target`
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddActionForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      isLoading={addActionMutation.isPending}
                    >
                      Salvar Ação e Metas
                    </Button>
                  </div>
                </form>
              )}

              {program.actions.length === 0 ? (
                <EmptyState
                  icon={Hammer}
                  title="Nenhuma Ação Governamental vinculada"
                  description="Cadastre os Projetos, Atividades ou Operações Especiais deste programa com suas respectivas metas para os 4 anos do PPA."
                  action={
                    !showAddActionForm ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowAddActionForm(true)}
                      >
                        Cadastrar Primeira Ação
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {program.actions.map((action) => {
                    const actMeta = ACTION_TYPE_META[action.action_type];
                    const totalFin = action.targets.reduce(
                      (acc, t) => acc + Number(t.financial_target || 0),
                      0
                    );
                    const totalPhys = action.targets.reduce(
                      (acc, t) => acc + Number(t.physical_target || 0),
                      0
                    );

                    return (
                      <div
                        key={action.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={actMeta.badgeVariant}>
                                {actMeta.label}
                              </Badge>
                              <span className="font-mono text-xs font-bold text-slate-700">
                                Cód. {action.code}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">
                                {action.title}
                              </h4>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              U.O.:{" "}
                              <strong className="font-mono text-slate-700">
                                {action.responsible_unit_code}
                              </strong>{" "}
                              ({action.responsible_unit_name}) • Classificação
                              Funcional:{" "}
                              <strong className="font-mono text-slate-700">
                                {action.function_code}.{action.subfunction_code}
                              </strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">
                              Total Quadriênio
                            </span>
                            <span className="text-sm font-bold text-gov-800">
                              {formatCurrencyBRL(totalFin)}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              Meta Física Acum.: {formatNumberBR(totalPhys)}{" "}
                              {action.unit_of_measure} ({action.product_name})
                            </span>
                          </div>
                        </div>

                        {action.targets.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                            {action.targets.map((target) => (
                              <div
                                key={target.id}
                                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                              >
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                  <span>Ano {target.year}</span>
                                  <span className="font-mono text-gov-700">
                                    {formatNumberBR(target.physical_target)}{" "}
                                    {action.unit_of_measure}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs font-bold text-slate-900">
                                  {formatCurrencyBRL(target.financial_target)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: INDICADORES DE DESEMPENHO */}
          {activeTab === "indicators" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Indicadores de resultado com linha de base, periodicidade e
                  meta final esperada ao término do PPA.
                </p>
                <Button
                  size="sm"
                  variant={showAddIndicatorForm ? "outline" : "primary"}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setShowAddIndicatorForm((prev) => !prev)}
                >
                  {showAddIndicatorForm
                    ? "Fechar Formulário"
                    : "Novo Indicador"}
                </Button>
              </div>

              {showAddIndicatorForm && (
                <form
                  onSubmit={handleIndSubmit(onSubmitNewIndicator)}
                  className="rounded-xl border border-gov-200 bg-gov-50/30 p-4 space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gov-900 border-b border-gov-100 pb-2">
                    Vincular Novo Indicador de Programa
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Código *"
                      placeholder="IND-EDU-01"
                      error={indErrors.code?.message}
                      {...regInd("code")}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Nome do Indicador *"
                        placeholder="Ex.: Taxa de Atendimento em Creches"
                        error={indErrors.name?.message}
                        {...regInd("name")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input
                      label="Unid. de Medida *"
                      placeholder="Percentual (%)"
                      error={indErrors.unit_of_measure?.message}
                      {...regInd("unit_of_measure")}
                    />
                    <Select
                      label="Periodicidade *"
                      options={[
                        { value: "ANUAL", label: "Anual" },
                        { value: "SEMESTRAL", label: "Semestral" },
                        { value: "QUADRIMESTRAL", label: "Quadrimestral" },
                        { value: "BIMESTRAL", label: "Bimestral" },
                        { value: "MENSAL", label: "Mensal" },
                      ]}
                      error={indErrors.periodicity?.message}
                      {...regInd("periodicity")}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Linha de Base *"
                      error={indErrors.baseline_value?.message}
                      {...regInd("baseline_value")}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Meta Final PPA *"
                      error={indErrors.target_value?.message}
                      {...regInd("target_value")}
                    />
                  </div>

                  <Input
                    label="Fórmula de Cálculo *"
                    placeholder="Ex.: (Matrículas realizadas / Demanda manifesta) * 100"
                    error={indErrors.formula?.message}
                    {...regInd("formula")}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddIndicatorForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      isLoading={addIndicatorMutation.isPending}
                    >
                      Salvar Indicador
                    </Button>
                  </div>
                </form>
              )}

              {program.indicators.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Nenhum Indicador cadastrado para este programa"
                  description="Adicione indicadores quantitativos para mensurar a evolução do programa governamental ao longo dos 4 anos do PPA."
                  action={
                    !showAddIndicatorForm ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowAddIndicatorForm(true)}
                      >
                        Adicionar Primeiro Indicador
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {program.indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                            {ind.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {ind.name}
                          </h4>
                          <Badge variant="info">{ind.periodicity}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Fórmula: <code className="text-slate-700">{ind.formula}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 bg-slate-50 rounded-lg px-3.5 py-2 border border-slate-100">
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-slate-400">
                            Linha de Base
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {formatNumberBR(ind.baseline_value)}{" "}
                            {ind.unit_of_measure}
                          </span>
                        </div>
                        <div className="text-slate-300">→</div>
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-gov-600">
                            Meta Final PPA
                          </span>
                          <span className="text-xs font-bold text-gov-800">
                            {formatNumberBR(ind.target_value)}{" "}
                            {ind.unit_of_measure}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
