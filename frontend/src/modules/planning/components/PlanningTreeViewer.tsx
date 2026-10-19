"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Compass,
  FolderKanban,
  Gauge,
  Hammer,
  Layers,
  Plus,
  Target as TargetIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ACTION_TYPE_META,
  formatCurrencyBRL,
  formatNumberBR,
  PROGRAM_TYPE_META,
} from "@/components/ui/utils";
import {
  CreateAxisModal,
  CreateObjectiveModal,
} from "@/modules/planning/components/AxisObjectiveModal";
import { useFullPPATreeQuery } from "@/modules/planning/hooks/usePlanningQueries";
import { GovernmentProgramDetail } from "@/types/planning";

export interface PlanningTreeViewerProps {
  ppaId: string;
  onSelectProgram?: (programId: string) => void;
  onOpenNewProgram?: (ppaId: string, objectiveId?: string) => void;
}

export function PlanningTreeViewer({
  ppaId,
  onSelectProgram,
  onOpenNewProgram,
}: PlanningTreeViewerProps) {
  const { data, isLoading, isError, refetch } = useFullPPATreeQuery(ppaId);

  const [createAxisOpen, setCreateAxisOpen] = useState(false);
  const [selectedAxisForObj, setSelectedAxisForObj] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [collapsedAxes, setCollapsedAxes] = useState<Record<string, boolean>>(
    {}
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-6 text-center">
        <p className="text-sm font-semibold text-red-800">
          Não foi possível carregar a árvore de planejamento deste PPA.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-3"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { ppa, programs } = data;
  const axes = ppa.strategic_axes || [];

  // Agrupa programas por objective_id e também identifica programas sem objetivo (ex.: Gestão/Manutenção)
  const programsByObjective = new Map<string, GovernmentProgramDetail[]>();
  const unlinkedPrograms: GovernmentProgramDetail[] = [];

  for (const prog of programs) {
    if (prog.objective_id) {
      const list = programsByObjective.get(prog.objective_id) || [];
      list.push(prog);
      programsByObjective.set(prog.objective_id, list);
    } else {
      unlinkedPrograms.push(prog);
    }
  }

  const toggleAxis = (axisId: string) => {
    setCollapsedAxes((prev) => ({ ...prev, [axisId]: !prev[axisId] }));
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Árvore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gov-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Cadeia de Valor do PPA: {ppa.name} ({ppa.start_year}-
              {ppa.end_year})
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Estrutura hierárquica: Eixo Estratégico → Objetivo → Programa →
            Ação/Projeto → Metas Físicas e Financeiras Anuais
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenNewProgram && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onOpenNewProgram(ppa.id)}
            >
              Novo Programa
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setCreateAxisOpen(true)}
          >
            Novo Eixo Estratégico
          </Button>
        </div>
      </div>

      {axes.length === 0 && unlinkedPrograms.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nenhum Eixo Estratégico ou Programa estruturado neste PPA"
          description="Comece cadastrando os Eixos Estratégicos do Plano de Governo, desdobre em Objetivos Estratégicos e vincule os Programas e Ações com suas metas quadrienais."
          action={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateAxisOpen(true)}
            >
              Criar Primeiro Eixo Estratégico
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {axes.map((axis) => {
            const isCollapsed = Boolean(collapsedAxes[axis.id]);
            return (
              <div
                key={axis.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Nível 1: Eixo Estratégico */}
                <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleAxis(axis.id)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gov-300" />
                    )}
                    <span className="rounded bg-gov-600 px-2 py-0.5 font-mono text-xs font-bold">
                      {axis.code}
                    </span>
                    <div>
                      <span className="text-sm font-semibold">{axis.name}</span>
                      {axis.description && (
                        <p className="text-[11px] text-slate-300 line-clamp-1">
                          {axis.description}
                        </p>
                      )}
                    </div>
                  </button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() =>
                      setSelectedAxisForObj({
                        id: axis.id,
                        name: `${axis.code} - ${axis.name}`,
                      })
                    }
                  >
                    Adicionar Objetivo
                  </Button>
                </div>

                {/* Nível 2: Objetivos Estratégicos */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4 bg-slate-50/40">
                    {axis.objectives.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                        Nenhum Objetivo Estratégico vinculado a este eixo.{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAxisForObj({
                              id: axis.id,
                              name: `${axis.code} - ${axis.name}`,
                            })
                          }
                          className="font-semibold text-gov-700 hover:underline"
                        >
                          Cadastrar objetivo agora
                        </button>
                      </div>
                    ) : (
                      axis.objectives.map((objective) => {
                        const objPrograms =
                          programsByObjective.get(objective.id) || [];

                        return (
                          <div
                            key={objective.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-start gap-2.5">
                                <TargetIcon className="h-4 w-4 text-gov-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-gov-700">
                                      {objective.code}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900">
                                      {objective.title}
                                    </span>
                                  </div>
                                  {objective.description && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      {objective.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {onOpenNewProgram && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                                  onClick={() =>
                                    onOpenNewProgram(ppa.id, objective.id)
                                  }
                                >
                                  Vincular Programa
                                </Button>
                              )}
                            </div>

                            {/* Nível 3: Programas Governamentais do Objetivo */}
                            {objPrograms.length === 0 ? (
                              <p className="pl-6 text-xs italic text-slate-400">
                                Nenhum Programa Governamental vinculado a este
                                objetivo estratégico.
                              </p>
                            ) : (
                              <div className="pl-2 sm:pl-6 space-y-3">
                                {objPrograms.map((program) => (
                                  <ProgramTreeNode
                                    key={program.id}
                                    program={program}
                                    onSelectProgram={onSelectProgram}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Programas de Gestão/Manutenção ou sem Objetivo Temático */}
          {unlinkedPrograms.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-semibold">
                    Programas de Gestão, Manutenção ou Não Vinculados a Objetivo
                    Específico
                  </span>
                </div>
                <Badge variant="neutral">
                  {unlinkedPrograms.length} programa(s)
                </Badge>
              </div>
              <div className="p-4 space-y-3 bg-slate-50/40">
                {unlinkedPrograms.map((prog) => (
                  <ProgramTreeNode
                    key={prog.id}
                    program={prog}
                    onSelectProgram={onSelectProgram}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais de criação de Eixo e Objetivo */}
      <CreateAxisModal
        isOpen={createAxisOpen}
        onClose={() => setCreateAxisOpen(false)}
        ppaId={ppa.id}
        ppaName={`${ppa.name} (${ppa.start_year}-${ppa.end_year})`}
      />

      {selectedAxisForObj && (
        <CreateObjectiveModal
          isOpen={Boolean(selectedAxisForObj)}
          onClose={() => setSelectedAxisForObj(null)}
          axisId={selectedAxisForObj.id}
          axisName={selectedAxisForObj.name}
        />
      )}
    </div>
  );
}

function ProgramTreeNode({
  program,
  onSelectProgram,
}: {
  program: GovernmentProgramDetail;
  onSelectProgram?: (programId: string) => void;
}) {
  const typeMeta = PROGRAM_TYPE_META[program.program_type];

  const totalProgramFinancial = program.actions.reduce((acc, act) => {
    const actSum = act.targets.reduce(
      (s, t) => s + Number(t.financial_target || 0),
      0
    );
    return acc + actSum;
  }, 0);

  return (
    <div className="rounded-lg border border-gov-100 bg-gov-50/25 p-3.5 space-y-3">
      {/* Cabeçalho do Programa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={typeMeta.badgeVariant}>{typeMeta.shortLabel}</Badge>
            <span className="font-mono text-xs font-bold text-slate-700">
              Prog. {program.code}
            </span>
            <span className="text-sm font-bold text-slate-900">
              {program.title}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Unidade Responsável:{" "}
            <strong className="text-slate-700">
              {program.responsible_unit}
            </strong>{" "}
            • Público-Alvo: {program.target_audience}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">
              Previsão 4 Anos
            </span>
            <span className="text-xs font-bold text-gov-800">
              {formatCurrencyBRL(totalProgramFinancial)}
            </span>
          </div>
          {onSelectProgram && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectProgram(program.id)}
            >
              Gerenciar Ações & Indicadores
            </Button>
          )}
        </div>
      </div>

      {/* Indicadores do Programa */}
      {program.indicators.length > 0 && (
        <div className="rounded-md bg-white/90 border border-slate-200/80 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            <Gauge className="h-3.5 w-3.5 text-gov-600" />
            Indicadores do Programa ({program.indicators.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {program.indicators.map((ind) => (
              <div
                key={ind.id}
                className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-700">
                    {ind.code}:
                  </span>{" "}
                  <span className="text-slate-800 font-medium">{ind.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-gov-800 whitespace-nowrap ml-2">
                  Base: {formatNumberBR(ind.baseline_value)} → Meta:{" "}
                  {formatNumberBR(ind.target_value)} ({ind.unit_of_measure})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nível 4 & 5: Ações Governamentais e Metas Físicas/Financeiras Anuais */}
      {program.actions.length === 0 ? (
        <p className="text-xs text-slate-400 italic pl-2">
          Nenhuma Ação Governamental (Projeto/Atividade) cadastrada neste
          programa.
        </p>
      ) : (
        <div className="space-y-2 pl-2 border-l-2 border-gov-200">
          {program.actions.map((action) => {
            const actMeta = ACTION_TYPE_META[action.action_type];
            return (
              <div
                key={action.id}
                className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Hammer className="h-3.5 w-3.5 text-slate-500" />
                    <Badge variant={actMeta.badgeVariant}>{actMeta.label}</Badge>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      Ação {action.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {action.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Função/Subfunção:{" "}
                    <strong className="font-mono">
                      {action.function_code}.{action.subfunction_code}
                    </strong>{" "}
                    | Produto:{" "}
                    <strong className="text-slate-700">
                      {action.product_name} ({action.unit_of_measure})
                    </strong>
                  </span>
                </div>

                {/* Tabela de Metas dos 4 Anos */}
                {action.targets.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {action.targets.map((target) => (
                      <div
                        key={target.id}
                        className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                          <span>Exercício {target.year}</span>
                          <span className="font-mono text-gov-700">
                            {formatNumberBR(target.physical_target)}{" "}
                            {action.unit_of_measure}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-bold text-slate-900">
                          {formatCurrencyBRL(target.financial_target)}
                        </div>
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
  );
}
