"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Coins,
  FolderKanban,
  Hammer,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/providers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  formatCurrencyBRL,
  PPA_STATUS_META,
  PROGRAM_TYPE_META,
} from "@/components/ui/utils";
import { PPAModalForm } from "@/modules/planning/components/PPAModalForm";
import {
  useFullPPATreeQuery,
  usePPAsQuery,
} from "@/modules/planning/hooks/usePlanningQueries";
import { extractApiErrorMessage } from "@/services/api";
import { planningService } from "@/services/planning.service";

export default function DashboardPage() {
  const { activeMunicipality, tenantId } = useTenant();
  const queryClient = useQueryClient();

  const [ppaModalOpen, setPpaModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const {
    data: ppasPage,
    isLoading: isLoadingPPAs,
    isError: isErrorPPAs,
    refetch: refetchPPAs,
  } = usePPAsQuery({ limit: 20 });

  const ppas = ppasPage?.items || [];

  // Seleciona o PPA ativo (EM_EXECUCAO ou APROVADO) ou o mais recente
  const activePPA = useMemo(() => {
    if (ppas.length === 0) return null;
    return (
      ppas.find((p) => p.status === "EM_EXECUCAO") ||
      ppas.find((p) => p.status === "APROVADO") ||
      ppas[0]
    );
  }, [ppas]);

  const { data: treeData, isLoading: isLoadingTree } = useFullPPATreeQuery(
    activePPA?.id || null
  );

  // Calcula indicadores síntese e distribuição nos 4 anos do PPA
  const metrics = useMemo(() => {
    const startYear = activePPA?.start_year || 2026;
    const years = [startYear, startYear + 1, startYear + 2, startYear + 3];

    const byYear: Record<
      number,
      { year: number; plannedFinancial: number; actionsCount: number }
    > = {};
    for (const yr of years) {
      byYear[yr] = { year: yr, plannedFinancial: 0, actionsCount: 0 };
    }

    if (!treeData) {
      return {
        totalPrograms: 0,
        thematicPrograms: 0,
        managementPrograms: 0,
        totalActions: 0,
        totalIndicators: 0,
        totalFinancialQuadrennial: 0,
        axesCount: 0,
        objectivesCount: 0,
        yearlyBreakdown: Object.values(byYear),
      };
    }

    const programs = treeData.programs || [];
    let totalActions = 0;
    let totalIndicators = 0;
    let totalFinancialQuadrennial = 0;
    let thematicPrograms = 0;
    let managementPrograms = 0;

    for (const prog of programs) {
      if (prog.program_type === "TEMATICO") thematicPrograms++;
      else managementPrograms++;

      totalIndicators += prog.indicators.length;
      totalActions += prog.actions.length;

      for (const act of prog.actions) {
        for (const t of act.targets) {
          const fin = Number(t.financial_target || 0);
          totalFinancialQuadrennial += fin;
          if (byYear[t.year]) {
            byYear[t.year].plannedFinancial += fin;
            byYear[t.year].actionsCount += 1;
          }
        }
      }
    }

    const axes = treeData.ppa.strategic_axes || [];
    const objectivesCount = axes.reduce(
      (acc, ax) => acc + ax.objectives.length,
      0
    );

    return {
      totalPrograms: programs.length,
      thematicPrograms,
      managementPrograms,
      totalActions,
      totalIndicators,
      totalFinancialQuadrennial,
      axesCount: axes.length,
      objectivesCount,
      yearlyBreakdown: Object.values(byYear),
    };
  }, [activePPA, treeData]);

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const ppa = await planningService.createPPA({
        name: "PPA 2026-2029 - Município Sustentável e Digital",
        start_year: 2026,
        end_year: 2029,
        status: "ELABORACAO",
        description:
          "Plano Plurianual quadrienal voltado à modernização dos serviços públicos, educação integral e saúde preventiva.",
      });

      const axisEdu = await planningService.createStrategicAxis({
        ppa_id: ppa.id,
        code: "EIXO-01",
        name: "Desenvolvimento Humano, Educação e Qualidade de Vida",
        description:
          "Promoção de políticas públicas integradas de educação básica e saúde da família.",
      });

      const objEdu = await planningService.createStrategicObjective({
        axis_id: axisEdu.id,
        code: "OBJ-01.01",
        title:
          "Ampliar a oferta de vagas em creches e elevar o IDEB dos anos iniciais",
        description:
          "Expansão da infraestrutura escolar e valorização pedagógica.",
      });

      await planningService.createProgram({
        ppa_id: ppa.id,
        objective_id: objEdu.id,
        code: "0012",
        title: "Educação Básica Transformadora e Inclusiva",
        program_type: "TEMATICO",
        responsible_unit: "Secretaria Municipal de Educação",
        target_audience:
          "Alunos da Educação Infantil e Ensino Fundamental da rede municipal",
        justification:
          "Necessidade de zerar o déficit de vagas em creches e modernizar as escolas municipais.",
        is_active: true,
        indicators: [
          {
            code: "IND-EDU-01",
            name: "Taxa de Atendimento Escolar de 0 a 3 anos",
            unit_of_measure: "Percentual (%)",
            formula: "(Matrículas em Creches / População 0 a 3 anos) * 100",
            periodicity: "ANUAL",
            baseline_value: 48.5,
            target_value: 75.0,
            is_cumulative: false,
          },
        ],
        actions: [
          {
            code: "1001",
            title: "Construção e Ampliação de Centros de Educação Infantil",
            action_type: "PROJETO",
            responsible_unit_code: "02.05.01",
            responsible_unit_name: "Fundo Municipal de Educação",
            function_code: "12",
            subfunction_code: "365",
            product_name: "CMEI Construído/Ampliado",
            unit_of_measure: "Unidade",
            targets: [
              { year: 2026, physical_target: 1, financial_target: 1450000 },
              { year: 2027, physical_target: 2, financial_target: 2900000 },
              { year: 2028, physical_target: 1, financial_target: 1600000 },
              { year: 2029, physical_target: 1, financial_target: 1750000 },
            ],
          },
          {
            code: "2004",
            title: "Manutenção da Rede de Ensino Fundamental e Alimentação Escolar",
            action_type: "ATIVIDADE",
            responsible_unit_code: "02.05.01",
            responsible_unit_name: "Secretaria Municipal de Educação",
            function_code: "12",
            subfunction_code: "361",
            product_name: "Aluno Atendido",
            unit_of_measure: "Aluno",
            targets: [
              { year: 2026, physical_target: 3200, financial_target: 4800000 },
              { year: 2027, physical_target: 3350, financial_target: 5100000 },
              { year: 2028, physical_target: 3500, financial_target: 5450000 },
              { year: 2029, physical_target: 3600, financial_target: 5800000 },
            ],
          },
        ],
      });

      queryClient.invalidateQueries();
      toast.success("Estrutura de demonstração do PPA 2026-2029 criada!", {
        description:
          "Foram criados 1 PPA, 1 Eixo Estratégico, 1 Objetivo, 1 Programa, 1 Indicador e 2 Ações com metas para os 4 anos.",
      });
    } catch (err) {
      toast.error("Não foi possível gerar os dados de exemplo", {
        description: extractApiErrorMessage(err),
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const maxYearlyFinancial = Math.max(
    ...metrics.yearlyBreakdown.map((y) => y.plannedFinancial),
    1
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Painel Executivo de Planejamento Orçamentário
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Síntese consolidada do Plano Plurianual (PPA) e Diretrizes
            Orçamentárias de{" "}
            <strong className="text-slate-700">
              {activeMunicipality.name}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/planejamento/programas">
            <Button variant="outline" size="sm">
              Gerenciar Programas
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setPpaModalOpen(true)}
          >
            Novo Ciclo de PPA
          </Button>
        </div>
      </div>

      {/* Estado de Erro de Conexão */}
      {isErrorPPAs && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900">
              Aguardando conexão com o Backend FastAPI
            </h3>
            <p className="text-xs text-amber-800">
              Verifique se o servidor FastAPI está em execução e acessível com o
              cabeçalho <code className="font-mono">X-Tenant-ID: {tenantId}</code>.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPPAs()}
            className="shrink-0 bg-white"
          >
            Testar Conexão Novamente
          </Button>
        </div>
      )}

      {/* Cards de Indicadores Síntese */}
      {isLoadingPPAs || isLoadingTree ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Ciclo do PPA Ativo */}
          <Card className="border-l-4 border-l-gov-600">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ciclo do PPA em Foco
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gov-50 text-gov-700">
                  <CalendarRange className="h-4 w-4" />
                </div>
              </div>
              {activePPA ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900">
                      {activePPA.start_year}–{activePPA.end_year}
                    </span>
                    <Badge
                      variant={PPA_STATUS_META[activePPA.status].badgeVariant}
                    >
                      {PPA_STATUS_META[activePPA.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {activePPA.name}
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <span className="text-sm font-semibold text-slate-400">
                    Nenhum PPA cadastrado
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Crie o quadriênio inicial
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Total de Programas */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Programas Governamentais
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <FolderKanban className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {metrics.totalPrograms}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  <strong className="text-slate-700">
                    {metrics.thematicPrograms}
                  </strong>{" "}
                  Temáticos •{" "}
                  <strong className="text-slate-700">
                    {metrics.managementPrograms}
                  </strong>{" "}
                  Gestão
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Volume de Ações e Indicadores */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ações / Projetos & Indicadores
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Hammer className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {metrics.totalActions}
                </span>
                <span className="ml-1.5 text-xs font-medium text-slate-500">
                  ações orçamentárias
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  <strong className="text-slate-700">
                    {metrics.totalIndicators}
                  </strong>{" "}
                  indicadores •{" "}
                  <strong className="text-slate-700">
                    {metrics.axesCount}
                  </strong>{" "}
                  eixos /{" "}
                  <strong className="text-slate-700">
                    {metrics.objectivesCount}
                  </strong>{" "}
                  objetivos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Metas Financeiras Projetadas */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Metas Financeiras (4 Anos)
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-gov-900">
                  {formatCurrencyBRL(metrics.totalFinancialQuadrennial)}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Previsão agregada das ações do PPA
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Caso não haja PPA para o município ativo */}
      {!isLoadingPPAs && !activePPA && !isErrorPPAs ? (
        <EmptyState
          icon={CalendarRange}
          title="Nenhum Ciclo de PPA cadastrado para este Município"
          description="Você pode cadastrar um novo ciclo quadrienal manualmente ou gerar uma estrutura completa de demonstração (PPA 2026-2029 com Eixo, Objetivo, Programa, Indicador, Ações e Metas) com 1 clique."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                isLoading={isSeeding}
                leftIcon={<Sparkles className="h-4 w-4 text-gov-600" />}
                onClick={handleSeedDemoData}
              >
                Gerar Estrutura Demo (PPA 2026-2029)
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setPpaModalOpen(true)}
              >
                Criar PPA Manualmente
              </Button>
            </div>
          }
        />
      ) : null}

      {/* Timeline e Gráfico de Distribuição Quadrienal do PPA */}
      {activePPA && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline / Gráfico de Barras dos 4 Exercícios */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gov-700" />
                  Projeção Quadrienal de Metas Financeiras ({activePPA.start_year}
                  –{activePPA.end_year})
                </CardTitle>
                <CardDescription>
                  Evolução anual dos recursos planejados nas Ações Governamentais
                  do ciclo ativo
                </CardDescription>
              </div>
              <Link
                href={`/planejamento/ppa?ppaId=${activePPA.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gov-700 hover:underline"
              >
                Ver Árvore Completa
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Linha do Tempo dos 4 Anos */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {metrics.yearlyBreakdown.map((item, idx) => {
                  const pct = Math.round(
                    (item.plannedFinancial / maxYearlyFinancial) * 100
                  );
                  return (
                    <div
                      key={item.year}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-gov-100 px-2 py-0.5 text-[11px] font-bold text-gov-900">
                          {idx + 1}º Ano • {item.year}
                        </span>
                        <TrendingUp className="h-3.5 w-3.5 text-gov-600" />
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-500">
                          Orçamento Planejado
                        </p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {formatCurrencyBRL(item.plannedFinancial)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gov-600 transition-all duration-500"
                            style={{
                              width: `${
                                item.plannedFinancial > 0
                                  ? Math.max(pct, 10)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.actionsCount} meta(s) de ações programadas
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo de Programas Cadastrados no Ciclo */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Programas Governamentais Vinculados ao Ciclo
                  </h4>
                  <Link
                    href="/planejamento/programas"
                    className="text-xs font-semibold text-gov-700 hover:underline"
                  >
                    Gerenciar todos
                  </Link>
                </div>

                {!treeData || treeData.programs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum programa governamental cadastrado neste ciclo até o
                    momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {treeData.programs.slice(0, 4).map((prog) => {
                      const progFin = prog.actions.reduce(
                        (acc, a) =>
                          acc +
                          a.targets.reduce(
                            (s, t) => s + Number(t.financial_target || 0),
                            0
                          ),
                        0
                      );
                      return (
                        <div
                          key={prog.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gov-700">
                              {prog.code}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {prog.title}
                            </span>
                            <Badge
                              variant={
                                PROGRAM_TYPE_META[prog.program_type]
                                  .badgeVariant
                              }
                            >
                              {PROGRAM_TYPE_META[prog.program_type].shortLabel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600">
                            <span>{prog.actions.length} ação(ões)</span>
                            <span className="font-bold text-slate-900">
                              {formatCurrencyBRL(progFin)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coluna Direita: Governança do Ciclo e Atalhos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gov-700" />
                Estrutura do Ciclo Fiscal
              </CardTitle>
              <CardDescription>
                Integração entre PPA, LDO e futura LOA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Lei Municipal do PPA:
                  </span>
                  <span className="font-mono text-slate-900">
                    {activePPA.law_number || "Em tramitação"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Eixos Estratégicos:
                  </span>
                  <span className="font-bold text-slate-900">
                    {metrics.axesCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Objetivos Estratégicos:
                  </span>
                  <span className="font-bold text-slate-900">
                    {metrics.objectivesCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800">
                  Ações Rápidas de Gestão:
                </p>
                <Link
                  href="/planejamento/ppa"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-gov-300 hover:bg-gov-50/40 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      Árvore de Planejamento do PPA
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gerenciar Eixos, Objetivos e Cadeia de Valor
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gov-700" />
                </Link>

                <Link
                  href="/planejamento/programas"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-gov-300 hover:bg-gov-50/40 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      Catálogo de Programas & Ações
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Configurar Indicadores e Metas Físicas/Financeiras
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gov-700" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PPAModalForm
        isOpen={ppaModalOpen}
        onClose={() => setPpaModalOpen(false)}
      />
    </div>
  );
}
