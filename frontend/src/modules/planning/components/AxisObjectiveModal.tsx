"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCreateAxisMutation,
  useCreateObjectiveMutation,
} from "@/modules/planning/hooks/usePlanningQueries";
import {
  strategicAxisFormSchema,
  StrategicAxisFormValues,
  strategicObjectiveFormSchema,
  StrategicObjectiveFormValues,
} from "@/modules/planning/schemas/planning.schema";

export interface CreateAxisModalProps {
  isOpen: boolean;
  onClose: () => void;
  ppaId: string;
  ppaName: string;
}

export function CreateAxisModal({
  isOpen,
  onClose,
  ppaId,
  ppaName,
}: CreateAxisModalProps) {
  const createAxisMutation = useCreateAxisMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StrategicAxisFormValues>({
    resolver: zodResolver(strategicAxisFormSchema),
    defaultValues: {
      ppa_id: ppaId,
      code: "EIXO-01",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        ppa_id: ppaId,
        code: "EIXO-01",
        name: "",
        description: "",
      });
    }
  }, [isOpen, ppaId, reset]);

  const onSubmit = async (values: StrategicAxisFormValues) => {
    await createAxisMutation.mutateAsync({
      ppa_id: ppaId,
      code: values.code,
      name: values.name,
      description: values.description || null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Eixo Estratégico"
      description={`Vincular macroagrupador estratégico ao ciclo: ${ppaName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Código *"
            placeholder="EIXO-01"
            error={errors.code?.message}
            {...register("code")}
          />
          <div className="sm:col-span-2">
            <Input
              label="Nome do Eixo Estratégico *"
              placeholder="Ex.: Desenvolvimento Social, Saúde e Educação"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
        </div>

        <Textarea
          label="Descrição / Visão de Futuro"
          placeholder="Descreva os pilares que compõem este Eixo Estratégico..."
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createAxisMutation.isPending}
          >
            Cadastrar Eixo Estratégico
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  axisId: string;
  axisName: string;
}

export function CreateObjectiveModal({
  isOpen,
  onClose,
  axisId,
  axisName,
}: CreateObjectiveModalProps) {
  const createObjectiveMutation = useCreateObjectiveMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StrategicObjectiveFormValues>({
    resolver: zodResolver(strategicObjectiveFormSchema),
    defaultValues: {
      axis_id: axisId,
      code: "OBJ-01.01",
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        axis_id: axisId,
        code: "OBJ-01.01",
        title: "",
        description: "",
      });
    }
  }, [isOpen, axisId, reset]);

  const onSubmit = async (values: StrategicObjectiveFormValues) => {
    await createObjectiveMutation.mutateAsync({
      axis_id: axisId,
      code: values.code,
      title: values.title,
      description: values.description || null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Objetivo Estratégico"
      description={`Eixo selecionado: ${axisName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Código *"
            placeholder="OBJ-01.01"
            error={errors.code?.message}
            {...register("code")}
          />
          <div className="sm:col-span-2">
            <Input
              label="Título do Objetivo Estratégico *"
              placeholder="Ex.: Universalizar o acesso à Educação Infantil"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>
        </div>

        <Textarea
          label="Detalhamento dos Resultados Esperados"
          placeholder="Descreva as diretrizes e impactos esperados para a população..."
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createObjectiveMutation.isPending}
          >
            Cadastrar Objetivo Estratégico
          </Button>
        </div>
      </form>
    </Modal>
  );
}
