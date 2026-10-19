"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderKanban,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { PROGRAM_TYPE_META } from "@/components/ui/utils";
import { ProgramDetailsDrawer } from "@/modules/planning/components/ProgramDetailsDrawer";
import { ProgramModalForm } from "@/modules/planning/components/ProgramModalForm";
import {
  useDeleteProgramMutation,
  usePPAsQuery,
  useProgramsQuery,
} from "@/modules/planning/hooks/usePlanningQueries";
import { GovernmentProgram, ProgramType } from "@/types/planning";

export default function ProgramsManagementPage() {
  const [search, setSearch] = useState("");
  const [ppaFilter, setPpaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProgramType | "">("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] =
    useState<GovernmentProgram | null>(null);
  const [drawerProgramId, setDrawerProgramId] = useState<string | null>(null);

  const { data: ppasPage } = usePPAsQuery({ limit: 50 });
  const ppas = ppasPage?.items || [];

  const { data: programsPage, isLoading } = useProgramsQuery({
    ppa_id: ppaFilter || undefined,
    program_type: typeFilter || undefined,
    search: search.trim() || undefined,
    skip: page * pageSize,
    limit: pageSize,
  });

  const deleteProgramMutation = useDeleteProgramMutation();

  const items = programsPage?.items || [];
  const total = programsPage?.total || 0;

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setProgramModalOpen(true);
  };

  const handleOpenEdit = (prog: GovernmentProgram) => {
    setEditingProgram(prog);
    setProgramModalOpen(true);
  };

  const handleDelete = async (prog: GovernmentProgram) => {
    const confirmed = window.confirm(
      `Confirma a exclusão do Programa "${prog.code} — ${prog.title}" e suas ações vinculadas?`
    );
    if (!confirmed) return;
    await deleteProgramMutation.mutateAsync(prog.id);
    if (drawerProgramId === prog.id) {
      setDrawerProgramId(null);
    }
  };

  const ppaMap = new Map(
    ppas.map((p) => [p.id, `${p.start_year}-${p.end_year}`])
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Programas Governamentais, Indicadores e Ações
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Gerencie o catálogo de Programas Temáticos e de Gestão/Manutenção,
            seus Indicadores e Ações Orçamentárias.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
          disabled={ppas.length === 0}
          title={
            ppas.length === 0
              ? "Cadastre um ciclo de PPA antes de criar programas"
              : undefined
          }
        >
          Novo Programa Governamental
        </Button>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderKanban className="h-4 w-4 text-gov-700" />
            Catálogo de Programas ({total})
          </CardTitle>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
            <div className="relative min-w-[220px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Código, título ou secretaria..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              aria-label="Filtrar por ciclo do PPA"
              value={ppaFilter}
              onChange={(e) => {
                setPpaFilter(e.target.value);
                setPage(0);
              }}
              className="h-9 text-xs"
              options={[
                { value: "", label: "Todos os Ciclos de PPA" },
                ...ppas.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.start_year}-${p.end_year})`,
                })),
              ]}
            />

            <Select
              aria-label="Filtrar por tipo de programa"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ProgramType | "");
                setPage(0);
              }}
              className="h-9 text-xs"
              options={[
                { value: "", label: "Todos os Tipos" },
                { value: "TEMATICO", label: "Programa Temático" },
                {
                  value: "GESTAO_MANUTENCAO",
                  label: "Gestão e Manutenção",
                },
              ]}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FolderKanban}
                title="Nenhum Programa Governamental encontrado"
                description={
                  ppas.length === 0
                    ? "Para cadastrar um Programa Governamental, crie primeiramente um Ciclo de PPA na tela de Gestão de PPA."
                    : "Cadastre os Programas Temáticos e de Gestão/Manutenção do município e vincule suas Ações e Indicadores."
                }
                action={
                  ppas.length > 0 ? (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={handleOpenCreate}
                    >
                      Cadastrar Primeiro Programa
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Programa / Público-Alvo</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Unidade Responsável</th>
                      <th className="py-3 px-4">Ciclo PPA</th>
                      <th className="py-3 px-4 text-right">
                        Indicadores & Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {items.map((prog) => {
                      const typeMeta = PROGRAM_TYPE_META[prog.program_type];
                      return (
                        <tr
                          key={prog.id}
                          className="hover:bg-slate-50/90 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-gov-800 whitespace-nowrap">
                            {prog.code}
                          </td>
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="font-semibold text-slate-900">
                              {prog.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              Público-Alvo: {prog.target_audience}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant={typeMeta.badgeVariant}>
                              {typeMeta.shortLabel}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {prog.responsible_unit}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {ppaMap.get(prog.ppa_id) || "PPA Vinculado"}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={
                                  <Settings2 className="h-3.5 w-3.5 text-gov-700" />
                                }
                                onClick={() => setDrawerProgramId(prog.id)}
                              >
                                Ações & Indicadores
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(prog)}
                                title="Editar dados cadastrais do Programa"
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(prog)}
                                title="Excluir Programa"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                  <strong>{total}</strong> programa(s)
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

      {/* Modal de Criação / Edição de Programa Governamental */}
      <ProgramModalForm
        isOpen={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        editingProgram={editingProgram}
        defaultPpaId={ppaFilter || ppas[0]?.id}
      />

      {/* Drawer lateral para Associar Indicadores, Ações e Metas Quadrienais */}
      <ProgramDetailsDrawer
        programId={drawerProgramId}
        onClose={() => setDrawerProgramId(null)}
      />
    </div>
  );
}
