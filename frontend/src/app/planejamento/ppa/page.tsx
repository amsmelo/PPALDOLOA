"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GitBranch,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { PPA_STATUS_META } from "@/components/ui/utils";
import { PlanningTreeViewer } from "@/modules/planning/components/PlanningTreeViewer";
import { PPAModalForm } from "@/modules/planning/components/PPAModalForm";
import { ProgramDetailsDrawer } from "@/modules/planning/components/ProgramDetailsDrawer";
import { ProgramModalForm } from "@/modules/planning/components/ProgramModalForm";
import {
  useDeletePPAMutation,
  usePPAsQuery,
} from "@/modules/planning/hooks/usePlanningQueries";
import { PPA, PPAStatus } from "@/types/planning";

export default function PPAManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PPAStatus | "">("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [ppaModalOpen, setPpaModalOpen] = useState(false);
  const [editingPPA, setEditingPPA] = useState<PPA | null>(null);
  const [selectedPpaIdForTree, setSelectedPpaIdForTree] = useState<
    string | null
  >(null);

  // Integração com modal de Programa e Drawer de Ações/Indicadores direto pela árvore
  const [programModalContext, setProgramModalContext] = useState<{
    open: boolean;
    ppaId?: string;
    objectiveId?: string;
  }>({ open: false });
  const [drawerProgramId, setDrawerProgramId] = useState<string | null>(null);

  const { data, isLoading } = usePPAsQuery({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    skip: page * pageSize,
    limit: pageSize,
  });

  const deletePPAMutation = useDeletePPAMutation();

  const items = data?.items || [];
  const total = data?.total || 0;

  // Seleciona automaticamente o primeiro PPA da lista para exibir a árvore
  useEffect(() => {
    if (!selectedPpaIdForTree && items.length > 0) {
      setSelectedPpaIdForTree(items[0].id);
    } else if (
      selectedPpaIdForTree &&
      items.length > 0 &&
      !items.some((p) => p.id === selectedPpaIdForTree)
    ) {
      setSelectedPpaIdForTree(items[0].id);
    }
  }, [items, selectedPpaIdForTree]);

  const handleOpenCreate = () => {
    setEditingPPA(null);
    setPpaModalOpen(true);
  };

  const handleOpenEdit = (ppa: PPA) => {
    setEditingPPA(ppa);
    setPpaModalOpen(true);
  };

  const handleDelete = async (ppa: PPA) => {
    const confirmed = window.confirm(
      `Confirma a exclusão do ciclo "${ppa.name} (${ppa.start_year}-${ppa.end_year})"?`
    );
    if (!confirmed) return;
    await deletePPAMutation.mutateAsync(ppa.id);
    if (selectedPpaIdForTree === ppa.id) {
      setSelectedPpaIdForTree(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Gestão de Ciclos do PPA e Árvore de Planejamento
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Gerencie os ciclos quadrienais do Plano Plurianual e navegue pela
            hierarquia estratégica municipal.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
        >
          Novo Ciclo de PPA
        </Button>
      </div>

      {/* Filtros e Tabela de Ciclos */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarRange className="h-4 w-4 text-gov-700" />
            Ciclos Quadrienais Cadastrados ({total})
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative min-w-[240px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Buscar por nome ou nº da lei..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              aria-label="Filtrar por status do PPA"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PPAStatus | "");
                setPage(0);
              }}
              className="h-9 text-xs min-w-[170px]"
              options={[
                { value: "", label: "Todos os Status" },
                { value: "ELABORACAO", label: "Em Elaboração" },
                { value: "APROVADO", label: "Aprovado" },
                { value: "EM_EXECUCAO", label: "Em Execução" },
                { value: "ENCERRADO", label: "Encerrado" },
              ]}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CalendarRange}
                title="Nenhum Ciclo de PPA encontrado"
                description="Cadastre o Plano Plurianual do município (ex.: 2026-2029) para habilitar o lançamento de Eixos, Objetivos e Programas Governamentais."
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={handleOpenCreate}
                  >
                    Cadastrar Ciclo de PPA
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Vigência</th>
                      <th className="py-3 px-4">Identificação do PPA</th>
                      <th className="py-3 px-4">Status Legal</th>
                      <th className="py-3 px-4">Lei Municipal</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {items.map((ppa) => {
                      const statusMeta = PPA_STATUS_META[ppa.status];
                      const isSelected = selectedPpaIdForTree === ppa.id;

                      return (
                        <tr
                          key={ppa.id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-gov-50/60"
                              : "hover:bg-slate-50/90"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-gov-800 whitespace-nowrap">
                            {ppa.start_year} – {ppa.end_year}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">
                              {ppa.name}
                            </p>
                            {ppa.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {ppa.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant={statusMeta.badgeVariant}>
                              {statusMeta.label}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {ppa.law_number ? (
                              <div>
                                <span className="font-medium text-slate-800">
                                  {ppa.law_number}
                                </span>
                                {ppa.law_date && (
                                  <span className="block text-[10px] text-slate-400">
                                    Sanção: {ppa.law_date}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="italic text-slate-400">
                                Minuta / Projeto de Lei
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant={isSelected ? "primary" : "outline"}
                                leftIcon={<GitBranch className="h-3.5 w-3.5" />}
                                onClick={() => setSelectedPpaIdForTree(ppa.id)}
                              >
                                {isSelected
                                  ? "Árvore Ativa"
                                  : "Ver Árvore"}
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(ppa)}
                                title="Editar Ciclo do PPA"
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(ppa)}
                                disabled={ppa.status !== "ELABORACAO"}
                                title={
                                  ppa.status === "ELABORACAO"
                                    ? "Excluir PPA"
                                    : "Apenas PPAs em elaboração podem ser excluídos"
                                }
                                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span>
                  Exibindo <strong>{items.length}</strong> de{" "}
                  <strong>{total}</strong> ciclo(s)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(page + 1) * pageSize >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visão Detalhada da Árvore de Planejamento do PPA Selecionado */}
      {selectedPpaIdForTree && (
        <div className="pt-2">
          <PlanningTreeViewer
            ppaId={selectedPpaIdForTree}
            onSelectProgram={(programId) => setDrawerProgramId(programId)}
            onOpenNewProgram={(ppaId, objectiveId) =>
              setProgramModalContext({
                open: true,
                ppaId,
                objectiveId,
              })
            }
          />
        </div>
      )}

      {/* Modal de Criação/Edição de PPA */}
      <PPAModalForm
        isOpen={ppaModalOpen}
        onClose={() => setPpaModalOpen(false)}
        editingPPA={editingPPA}
      />

      {/* Modal de Criação de Programa direto pela Árvore */}
      <ProgramModalForm
        isOpen={programModalContext.open}
        onClose={() => setProgramModalContext({ open: false })}
        defaultPpaId={programModalContext.ppaId}
        defaultObjectiveId={programModalContext.objectiveId}
      />

      {/* Drawer de Ações, Metas e Indicadores do Programa */}
      <ProgramDetailsDrawer
        programId={drawerProgramId}
        onClose={() => setDrawerProgramId(null)}
      />
    </div>
  );
}
