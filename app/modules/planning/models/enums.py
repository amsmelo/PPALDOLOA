"""Enumerações de domínio do Módulo de Planejamento Público."""

from enum import StrEnum


class PPAStatus(StrEnum):
    """Ciclo de vida legal e operacional do Plano Plurianual (PPA)."""

    ELABORACAO = "ELABORACAO"
    APROVADO = "APROVADO"
    EM_EXECUCAO = "EM_EXECUCAO"
    ENCERRADO = "ENCERRADO"


class ProgramType(StrEnum):
    """Classificação de Programa Governamental segundo o Manual Técnico de Orçamento."""

    TEMATICO = "TEMATICO"
    GESTAO_MANUTENCAO = "GESTAO_MANUTENCAO"


class ActionType(StrEnum):
    """Natureza da Ação Governamental (Portaria MOG nº 42/1999)."""

    PROJETO = "PROJETO"
    ATIVIDADE = "ATIVIDADE"
    OPERACAO_ESPECIAL = "OPERACAO_ESPECIAL"


class IndicatorPeriodicity(StrEnum):
    """Periodicidade de aferição do Indicador de Programa."""

    MENSAL = "MENSAL"
    BIMESTRAL = "BIMESTRAL"
    QUADRIMESTRAL = "QUADRIMESTRAL"
    SEMESTRAL = "SEMESTRAL"
    ANUAL = "ANUAL"


class LDOStatus(StrEnum):
    """Ciclo de vida da Lei de Diretrizes Orçamentárias (LDO)."""

    ELABORACAO = "ELABORACAO"
    APROVADA = "APROVADA"
    EM_EXECUCAO = "EM_EXECUCAO"
    ENCERRADA = "ENCERRADA"
