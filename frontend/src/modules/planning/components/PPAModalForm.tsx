"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCreatePPAMutation,
  useUpdatePPAMutation,
} from "@/modules/planning/hooks/usePlanningQueries";
import {
  ppaFormSchema,
  PPAFormValues,
} from "@/modules/planning/schemas/planning.schema";
import { PPA } from "@/types/planning";

export interface PPAModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPPA?: PPA | null;
}

export function PPAModalForm({
  isOpen,
  onClose,
  editingPPA,
}: PPAModalFormProps) {
  const isEditing = Boolean(editingPPA);
  const createMutation = useCreatePPAMutation();
  const updateMutation = useUpdatePPAMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PPAFormValues>({
    resolver: zodResolver(ppaFormSchema),
    defaultValues: {
      name: "PPA 2026-2029 - Município Sustentável e Inovador",
      start_year: 2026,
      end_year: 2029,
      status: "ELABORACAO",
      law_number: "",
      law_date: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editingPPA) {
      reset({
        name: editingPPA.name,
        start_year: editingPPA.start_year,
        end_year: editingPPA.end_year,
        status: editingPPA.status,
        law_number: editingPPA.law_number || "",
        law_date: editingPPA.law_date || "",
        description: editingPPA.description || "",
      });
    } else {
      reset({
        name: "PPA 2026-2029 - Planejamento Estratégico Municipal",
        start_year: 2026,
        end_year: 2029,
        status: "ELABORACAO",
        law_number: "",
        law_date: "",
        description: "",
      });
    }
  }, [editingPPA, isOpen, reset]);

  const watchedStartYear = watch("start_year");
  const watchedStatus = watch("status");

  const handleAutoAdjustEndYear = () => {
    const startNum = Number(watchedStartYear);
    if (!Number.isNaN(startNum) && startNum >= 2000 && startNum <= 2100) {
      setValue("end_year", startNum + 3, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: PPAFormValues) => {
    const payload = {
      name: values.name,
      start_year: values.start_year,
      end_year: values.end_year,
      status: values.status,
      law_number: values.law_number?.trim() ? values.law_number.trim() : null,
      law_date: values.law_date?.trim() ? values.law_date.trim() : null,
      description: values.description?.trim()
        ? values.description.trim()
        : null,
    };

    if (isEditing && editingPPA) {
      await updateMutation.mutateAsync({
        ppaId: editingPPA.id,
        payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
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
          ? `Editar Ciclo do PPA (${editingPPA?.start_year}-${editingPPA?.end_year})`
          : "Novo Ciclo de Plano Plurianual (PPA)"
      }
      description="Defina o período quadrienal (4 exercícios consecutivos) e a situação legal do instrumento de planejamento."
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Título de Identificação do PPA *"
          placeholder="Ex.: PPA 2026-2029 - Desenvolvimento e Cidadania"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Ano Inicial de Vigência *"
            placeholder="2026"
            error={errors.start_year?.message}
            {...register("start_year", {
              onChange: (e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val) && val >= 2000 && val <= 2100) {
                  setValue("end_year", val + 3, { shouldValidate: true });
                }
              },
            })}
          />

          <div className="space-y-1">
            <Input
              type="number"
              label="Ano Final de Vigência (Ano Inicial + 3) *"
              placeholder="2029"
              error={errors.end_year?.message}
              {...register("end_year")}
            />
            <button
              type="button"
              onClick={handleAutoAdjustEndYear}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gov-700 hover:underline"
            >
              <CalendarCheck2 className="h-3 w-3" />
              Calcular quadriênio automático ({Number(watchedStartYear || 2026) + 3})
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gov-100 bg-gov-50/60 p-3 flex items-start gap-2.5 text-xs text-gov-900">
          <Info className="h-4 w-4 text-gov-700 shrink-0 mt-0.5" />
          <div>
            <strong>Regra Constitucional (Art. 165, § 1º CF/88):</strong> O PPA
            tem vigência de 4 exercícios financeiros, iniciando no segundo ano
            do mandato do prefeito e encerrando no primeiro ano do mandato
            subsequente (<code>end_year = start_year + 3</code>).
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Status do Ciclo *"
            options={[
              { value: "ELABORACAO", label: "Em Elaboração" },
              { value: "APROVADO", label: "Aprovado (Sancionado)" },
              { value: "EM_EXECUCAO", label: "Em Execução" },
              { value: "ENCERRADO", label: "Encerrado" },
            ]}
            error={errors.status?.message}
            {...register("status")}
          />

          <Input
            label={
              watchedStatus === "APROVADO" || watchedStatus === "EM_EXECUCAO"
                ? "Número da Lei Municipal *"
                : "Número da Lei Municipal"
            }
            placeholder="Ex.: Lei nº 1.452/2025"
            error={errors.law_number?.message}
            {...register("law_number")}
          />

          <Input
            type="date"
            label="Data da Lei / Sanção"
            error={errors.law_date?.message}
            {...register("law_date")}
          />
        </div>

        <Textarea
          label="Diretrizes Gerais / Mensagem de Encaminhamento"
          placeholder="Resumo executivo das prioridades estratégicas do município para o quadriênio..."
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isEditing ? "Salvar Alterações" : "Cadastrar Ciclo do PPA"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
