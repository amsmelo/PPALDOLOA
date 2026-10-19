"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCreateProgramMutation,
  usePPADetailQuery,
  usePPAsQuery,
  useUpdateProgramMutation,
} from "@/modules/planning/hooks/usePlanningQueries";
import {
  programFormSchema,
  ProgramFormValues,
} from "@/modules/planning/schemas/planning.schema";
import { GovernmentProgram } from "@/types/planning";

export interface ProgramModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProgram?: GovernmentProgram | null;
  defaultPpaId?: string;
  defaultObjectiveId?: string;
}

export function ProgramModalForm({
  isOpen,
  onClose,
  editingProgram,
  defaultPpaId,
  defaultObjectiveId,
}: ProgramModalFormProps) {
  const isEditing = Boolean(editingProgram);

  const { data: ppasPage } = usePPAsQuery({ limit: 50 });
  const ppas = ppasPage?.items || [];

  const createMutation = useCreateProgramMutation();
  const updateMutation = useUpdateProgramMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      ppa_id: defaultPpaId || ppas[0]?.id || "",
      objective_id: defaultObjectiveId || "",
      code: "",
      title: "",
      program_type: "TEMATICO",
      responsible_unit: "",
      target_audience: "",
      justification: "",
      is_active: true,
    },
  });

  const selectedPpaId = watch("ppa_id");
  const { data: ppaDetail } = usePPADetailQuery(selectedPpaId || null);

  const objectiveOptions = useMemo(() => {
    if (!ppaDetail?.strategic_axes) return [];
    const list: { value: string; label: string }[] = [];
    for (const axis of ppaDetail.strategic_axes) {
      for (const obj of axis.objectives) {
        list.push({
          value: obj.id,
          label: `[${axis.code}] ${obj.code} — ${obj.title}`,
        });
      }
    }
    return list;
  }, [ppaDetail]);

  useEffect(() => {
    if (editingProgram) {
      reset({
        ppa_id: editingProgram.ppa_id,
        objective_id: editingProgram.objective_id || "",
        code: editingProgram.code,
        title: editingProgram.title,
        program_type: editingProgram.program_type,
        responsible_unit: editingProgram.responsible_unit,
        target_audience: editingProgram.target_audience,
        justification: editingProgram.justification,
        is_active: editingProgram.is_active,
      });
    } else {
      reset({
        ppa_id: defaultPpaId || ppas[0]?.id || "",
        objective_id: defaultObjectiveId || "",
        code: "",
        title: "",
        program_type: "TEMATICO",
        responsible_unit: "",
        target_audience: "",
        justification: "",
        is_active: true,
      });
    }
  }, [editingProgram, defaultPpaId, defaultObjectiveId, ppas, isOpen, reset]);

  const onSubmit = async (values: ProgramFormValues) => {
    if (isEditing && editingProgram) {
      await updateMutation.mutateAsync({
        programId: editingProgram.id,
        payload: {
          objective_id: values.objective_id?.trim()
            ? values.objective_id.trim()
            : null,
          code: values.code,
          title: values.title,
          program_type: values.program_type,
          responsible_unit: values.responsible_unit,
          target_audience: values.target_audience,
          justification: values.justification,
          is_active: values.is_active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        ppa_id: values.ppa_id,
        objective_id: values.objective_id?.trim()
          ? values.objective_id.trim()
          : null,
        code: values.code,
        title: values.title,
        program_type: values.program_type,
        responsible_unit: values.responsible_unit,
        target_audience: values.target_audience,
        justification: values.justification,
        is_active: values.is_active,
        indicators: [],
        actions: [],
      });
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Editar Programa Governamental (${editingProgram?.code})`
          : "Novo Programa Governamental"
      }
      description="Configure o programa orçamentário que articulará indicadores e ações governamentais no PPA e na LOA."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Ciclo do PPA *"
            disabled={isEditing}
            placeholder="Selecione o PPA..."
            options={ppas.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.start_year}-${p.end_year})`,
            }))}
            error={errors.ppa_id?.message}
            {...register("ppa_id")}
          />

          <Select
            label="Tipo de Programa *"
            options={[
              {
                value: "TEMATICO",
                label: "Temático / Finalístico (Entrega Direta)",
              },
              {
                value: "GESTAO_MANUTENCAO",
                label: "Gestão, Manutenção e Apoio Administrativo",
              },
            ]}
            error={errors.program_type?.message}
            {...register("program_type")}
          />
        </div>

        <Select
          label="Objetivo Estratégico Vinculado (Opcional para Gestão)"
          placeholder="Sem vínculo a objetivo temático específico"
          options={objectiveOptions}
          error={errors.objective_id?.message}
          helperText="Para adicionar novos Eixos ou Objetivos, utilize a Árvore de Planejamento em Gestão de PPA."
          {...register("objective_id")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Código *"
            placeholder="0010"
            error={errors.code?.message}
            {...register("code")}
          />
          <div className="sm:col-span-3">
            <Input
              label="Título Oficial do Programa *"
              placeholder="Ex.: Educação Básica de Qualidade e Inclusiva"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unidade / Secretaria Responsável *"
            placeholder="Ex.: Secretaria Municipal de Educação"
            error={errors.responsible_unit?.message}
            {...register("responsible_unit")}
          />

          <Input
            label="Público-Alvo Beneficiado *"
            placeholder="Ex.: Estudantes da rede pública municipal"
            error={errors.target_audience?.message}
            {...register("target_audience")}
          />
        </div>

        <Textarea
          label="Diagnóstico / Justificativa do Problema *"
          placeholder="Descreva a situação-problema que demanda a intervenção deste programa governamental..."
          rows={3}
          error={errors.justification?.message}
          {...register("justification")}
        />

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isEditing ? "Salvar Alterações" : "Cadastrar Programa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
