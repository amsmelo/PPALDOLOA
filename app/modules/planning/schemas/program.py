"""Schemas Pydantic v2 para Programas Governamentais, Indicadores, Ações, Metas e LDO."""

from datetime import date
from decimal import Decimal
from typing import Self
from uuid import UUID

from pydantic import Field, model_validator

from app.modules.planning.models.enums import (
    ActionType,
    IndicatorPeriodicity,
    LDOStatus,
    ProgramType,
)
from app.shared.schemas import ORMBaseSchema, TenantAuditReadSchema


# ==============================================================================
# Metas Físicas e Financeiras Anuais (Target)
# ==============================================================================
class TargetBase(ORMBaseSchema):
    year: int = Field(
        ...,
        ge=2000,
        le=2103,
        examples=[2026],
        description="Exercício financeiro dentro do quadriênio do PPA.",
    )
    physical_target: Decimal = Field(
        ...,
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=4,
        examples=[Decimal("120.0000")],
        description="Meta física prevista para o ano.",
    )
    financial_target: Decimal = Field(
        ...,
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=2,
        examples=[Decimal("450000.00")],
        description="Meta financeira prevista em R$ para o ano.",
    )
    executed_physical: Decimal = Field(
        default=Decimal("0.0000"),
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=4,
    )
    executed_financial: Decimal = Field(
        default=Decimal("0.00"),
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=2,
    )
    notes: str | None = Field(default=None)


class TargetNestedCreate(TargetBase):
    """Schema de meta anual embutido na criação de uma Ação Governamental."""


class TargetCreate(TargetBase):
    action_id: UUID


class TargetRead(TargetBase, TenantAuditReadSchema):
    action_id: UUID


# ==============================================================================
# Ações Governamentais (Projeto, Atividade, Operação Especial)
# ==============================================================================
class GovernmentActionBase(ORMBaseSchema):
    code: str = Field(..., min_length=1, max_length=10, examples=["1001"])
    title: str = Field(
        ...,
        min_length=3,
        max_length=250,
        examples=["Construção e Ampliação de Centros Municipais de Educação Infantil"],
    )
    description: str | None = Field(default=None)
    action_type: ActionType = Field(..., examples=[ActionType.PROJETO])
    responsible_unit_code: str = Field(..., min_length=1, max_length=30, examples=["02.05.01"])
    responsible_unit_name: str = Field(
        ...,
        min_length=3,
        max_length=180,
        examples=["Secretaria Municipal de Educação"],
    )
    function_code: str = Field(..., min_length=1, max_length=4, examples=["12"])
    subfunction_code: str = Field(..., min_length=1, max_length=4, examples=["365"])
    product_name: str = Field(..., min_length=2, max_length=150, examples=["Creche Construída"])
    unit_of_measure: str = Field(..., min_length=1, max_length=50, examples=["Unidade"])
    is_active: bool = Field(default=True)


class GovernmentActionNestedCreate(GovernmentActionBase):
    """Criação de Ação Governamental aninhada ao Programa com metas para o quadriênio."""

    targets: list[TargetNestedCreate] = Field(
        default_factory=list,
        description="Metas físicas e financeiras anuais projetadas para o quadriênio.",
    )

    @model_validator(mode="after")
    def validate_unique_target_years(self) -> Self:
        years = [t.year for t in self.targets]
        if len(years) != len(set(years)):
            raise ValueError(
                "Não é permitido informar metas duplicadas para o mesmo exercício financeiro "
                "dentro da mesma ação governamental."
            )
        return self


class GovernmentActionCreate(GovernmentActionNestedCreate):
    program_id: UUID


class GovernmentActionRead(GovernmentActionBase, TenantAuditReadSchema):
    program_id: UUID
    targets: list[TargetRead] = Field(default_factory=list)


# ==============================================================================
# Indicadores de Programa (Indicator)
# ==============================================================================
class IndicatorBase(ORMBaseSchema):
    code: str = Field(..., min_length=1, max_length=30, examples=["IND-EDU-01"])
    name: str = Field(
        ...,
        min_length=3,
        max_length=200,
        examples=["Taxa de Atendimento em Creches (0 a 3 anos)"],
    )
    unit_of_measure: str = Field(..., min_length=1, max_length=50, examples=["Percentual (%)"])
    formula: str = Field(
        ...,
        min_length=3,
        examples=["(Matrículas de 0 a 3 anos / População estimada de 0 a 3 anos) * 100"],
    )
    periodicity: IndicatorPeriodicity = Field(default=IndicatorPeriodicity.ANUAL)
    baseline_value: Decimal = Field(
        default=Decimal("0.0000"),
        max_digits=18,
        decimal_places=4,
        examples=[Decimal("42.5000")],
    )
    baseline_date: date | None = Field(default=None)
    target_value: Decimal = Field(
        ...,
        max_digits=18,
        decimal_places=4,
        examples=[Decimal("65.0000")],
    )
    is_cumulative: bool = Field(default=False)


class IndicatorNestedCreate(IndicatorBase):
    """Criação de indicador aninhada ao Programa Governamental."""


class IndicatorCreate(IndicatorBase):
    program_id: UUID


class IndicatorRead(IndicatorBase, TenantAuditReadSchema):
    program_id: UUID


# ==============================================================================
# Programas Governamentais (GovernmentProgram)
# ==============================================================================
class GovernmentProgramBase(ORMBaseSchema):
    ppa_id: UUID = Field(..., description="ID do ciclo de PPA ao qual o programa pertence.")
    objective_id: UUID | None = Field(
        default=None,
        description="ID do Objetivo Estratégico vinculado (opcional para programas de gestão).",
    )
    code: str = Field(
        ...,
        min_length=1,
        max_length=10,
        examples=["0010"],
        description="Código oficial do Programa Governamental.",
    )
    title: str = Field(
        ...,
        min_length=3,
        max_length=250,
        examples=["Educação Básica de Qualidade e Inclusiva"],
    )
    justification: str = Field(
        ...,
        min_length=5,
        examples=["Necessidade de ampliar a oferta de vagas na rede municipal e elevar o IDEB."],
    )
    target_audience: str = Field(
        ...,
        min_length=3,
        max_length=250,
        examples=["Estudantes da Educação Infantil e do Ensino Fundamental do município"],
    )
    program_type: ProgramType = Field(
        default=ProgramType.TEMATICO,
        examples=[ProgramType.TEMATICO],
    )
    responsible_unit: str = Field(
        ...,
        min_length=3,
        max_length=150,
        examples=["Secretaria Municipal de Educação"],
    )
    is_active: bool = Field(default=True)


class GovernmentProgramCreate(GovernmentProgramBase):
    """Schema de criação de Programa Governamental (suporta indicadores e ações aninhadas)."""

    indicators: list[IndicatorNestedCreate] = Field(
        default_factory=list,
        description="Lista opcional de indicadores vinculados na criação do programa.",
    )
    actions: list[GovernmentActionNestedCreate] = Field(
        default_factory=list,
        description="Lista opcional de ações governamentais e suas metas quadrienais.",
    )

    @model_validator(mode="after")
    def validate_nested_uniqueness(self) -> Self:
        ind_codes = [ind.code for ind in self.indicators]
        if len(ind_codes) != len(set(ind_codes)):
            raise ValueError("Existem códigos de indicadores duplicados no payload do programa.")

        action_codes = [act.code for act in self.actions]
        if len(action_codes) != len(set(action_codes)):
            raise ValueError("Existem códigos de ações governamentais duplicados no payload.")
        return self


class GovernmentProgramUpdate(ORMBaseSchema):
    """Schema para atualização parcial ou total dos dados cadastrais do Programa Governamental."""

    objective_id: UUID | None = Field(default=None)
    code: str | None = Field(default=None, min_length=1, max_length=10)
    title: str | None = Field(default=None, min_length=3, max_length=250)
    justification: str | None = Field(default=None, min_length=5)
    target_audience: str | None = Field(default=None, min_length=3, max_length=250)
    program_type: ProgramType | None = Field(default=None)
    responsible_unit: str | None = Field(default=None, min_length=3, max_length=150)
    is_active: bool | None = Field(default=None)


class GovernmentProgramRead(GovernmentProgramBase, TenantAuditReadSchema):
    """Schema de saída resumido do Programa Governamental."""


class GovernmentProgramDetailRead(GovernmentProgramRead):
    """Schema de saída detalhado do Programa com Indicadores, Ações e Metas Anuais."""

    indicators: list[IndicatorRead] = Field(default_factory=list)
    actions: list[GovernmentActionRead] = Field(default_factory=list)


class GovernmentProgramFilter(ORMBaseSchema):
    """Filtros de pesquisa para listagem de Programas Governamentais."""

    ppa_id: UUID | None = None
    objective_id: UUID | None = None
    program_type: ProgramType | None = None
    is_active: bool | None = None
    search: str | None = Field(
        default=None,
        description="Busca textual por código, título ou unidade responsável.",
    )
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


# ==============================================================================
# LDO e Anexo de Metas e Prioridades (LDO & LDOItem)
# ==============================================================================
class LDOItemBase(ORMBaseSchema):
    action_id: UUID = Field(..., description="Ação Governamental do PPA priorizada para o ano.")
    priority_level: int = Field(default=1, ge=1, le=10)
    adjusted_physical_target: Decimal = Field(
        ...,
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=4,
    )
    adjusted_financial_target: Decimal = Field(
        ...,
        ge=Decimal("0"),
        max_digits=18,
        decimal_places=2,
    )
    justification: str | None = Field(default=None)


class LDOItemCreate(LDOItemBase):
    ldo_id: UUID


class LDOItemRead(LDOItemBase, TenantAuditReadSchema):
    ldo_id: UUID


class LDOBase(ORMBaseSchema):
    ppa_id: UUID
    fiscal_year: int = Field(..., ge=2000, le=2103, examples=[2026])
    status: LDOStatus = Field(default=LDOStatus.ELABORACAO)
    law_number: str | None = Field(default=None, max_length=60)
    law_date: date | None = Field(default=None)
    primary_result_target: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=18,
        decimal_places=2,
    )
    nominal_result_target: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=18,
        decimal_places=2,
    )
    notes: str | None = Field(default=None)


class LDOCreate(LDOBase):
    items: list[LDOItemBase] = Field(default_factory=list)


class LDORead(LDOBase, TenantAuditReadSchema):
    items: list[LDOItemRead] = Field(default_factory=list)
