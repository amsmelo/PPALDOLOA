"""Schemas Pydantic v2 para Ciclos de PPA, Eixos Estratégicos e Objetivos Estratégicos."""

from datetime import date
from typing import Self
from uuid import UUID

from pydantic import Field, model_validator

from app.modules.planning.models.enums import PPAStatus
from app.shared.schemas import ORMBaseSchema, TenantAuditReadSchema


# ==============================================================================
# Eixos e Objetivos Estratégicos
# ==============================================================================
class StrategicObjectiveBase(ORMBaseSchema):
    code: str = Field(..., min_length=1, max_length=20, examples=["OBJ-01.01"])
    title: str = Field(
        ...,
        min_length=3,
        max_length=250,
        examples=["Universalizar o acesso à educação infantil em tempo integral"],
    )
    description: str | None = Field(default=None)


class StrategicObjectiveCreate(StrategicObjectiveBase):
    axis_id: UUID


class StrategicObjectiveRead(StrategicObjectiveBase, TenantAuditReadSchema):
    axis_id: UUID


class StrategicAxisBase(ORMBaseSchema):
    code: str = Field(..., min_length=1, max_length=20, examples=["EIXO-01"])
    name: str = Field(
        ...,
        min_length=3,
        max_length=200,
        examples=["Desenvolvimento Humano, Educação e Qualidade de Vida"],
    )
    description: str | None = Field(default=None)


class StrategicAxisCreate(StrategicAxisBase):
    ppa_id: UUID


class StrategicAxisRead(StrategicAxisBase, TenantAuditReadSchema):
    ppa_id: UUID
    objectives: list[StrategicObjectiveRead] = Field(default_factory=list)


# ==============================================================================
# Ciclo do PPA (Plano Plurianual Quadrienal)
# ==============================================================================
class PPABase(ORMBaseSchema):
    name: str = Field(
        ...,
        min_length=3,
        max_length=150,
        examples=["PPA 2026-2029 - Município Sustentável e Inovador"],
    )
    start_year: int = Field(
        ...,
        ge=2000,
        le=2100,
        examples=[2026],
        description="Ano inicial de vigência do PPA.",
    )
    end_year: int = Field(
        ...,
        ge=2003,
        le=2103,
        examples=[2029],
        description="Ano final de vigência do PPA (deve ser start_year + 3).",
    )
    status: PPAStatus = Field(
        default=PPAStatus.ELABORACAO,
        description="Status do ciclo do PPA.",
    )
    law_number: str | None = Field(
        default=None,
        max_length=60,
        examples=["Lei Municipal nº 1.452/2025"],
    )
    law_date: date | None = Field(default=None)
    description: str | None = Field(default=None)


class PPACreate(PPABase):
    """Schema de entrada para abertura de um novo ciclo de PPA."""

    @model_validator(mode="after")
    def validate_quadrennial_period(self) -> Self:
        if self.end_year != self.start_year + 3:
            raise ValueError(
                f"Vigência quadrienal inválida: o ano de término ({self.end_year}) "
                f"deve ser exatamente igual ao ano de início + 3 ({self.start_year + 3})."
            )
        if self.status in (PPAStatus.APROVADO, PPAStatus.EM_EXECUCAO) and not self.law_number:
            raise ValueError(
                "Para ciclos de PPA com status APROVADO ou EM_EXECUCAO, é obrigatório "
                "informar o número da Lei Municipal (law_number)."
            )
        return self


class PPAUpdate(ORMBaseSchema):
    """Schema de atualização parcial (PATCH/PUT) de um ciclo de PPA."""

    name: str | None = Field(default=None, min_length=3, max_length=150)
    start_year: int | None = Field(default=None, ge=2000, le=2100)
    end_year: int | None = Field(default=None, ge=2003, le=2103)
    status: PPAStatus | None = Field(default=None)
    law_number: str | None = Field(default=None, max_length=60)
    law_date: date | None = Field(default=None)
    description: str | None = Field(default=None)

    @model_validator(mode="after")
    def validate_partial_years(self) -> Self:
        if (
            self.start_year is not None
            and self.end_year is not None
            and self.end_year != self.start_year + 3
        ):
            raise ValueError(
                f"Vigência quadrienal inválida: o ano de término ({self.end_year}) "
                f"deve ser exatamente igual ao ano de início + 3 ({self.start_year + 3})."
            )
        return self


class PPARead(PPABase, TenantAuditReadSchema):
    """Schema de saída resumido de um ciclo de PPA."""


class PPADetailRead(PPARead):
    """Schema de saída detalhado do PPA incluindo seus Eixos e Objetivos Estratégicos."""

    strategic_axes: list[StrategicAxisRead] = Field(default_factory=list)


class PPAFilter(ORMBaseSchema):
    """Parâmetros de filtragem para consulta de ciclos de PPA."""

    status: PPAStatus | None = None
    reference_year: int | None = Field(
        default=None,
        ge=2000,
        le=2103,
        description="Filtra PPAs vigentes no exercício financeiro informado.",
    )
    search: str | None = Field(
        default=None,
        description="Busca textual pelo nome ou número da lei do PPA.",
    )
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
