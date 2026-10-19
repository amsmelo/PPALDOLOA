"""Schemas Pydantic v2 compartilhados para paginação, auditoria e respostas padrão."""

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMBaseSchema(BaseModel):
    """Schema base configurado para leitura de atributos ORM (SQLAlchemy 2.0)."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class TenantAuditReadSchema(ORMBaseSchema):
    """Campos comuns de saída de todas as entidades multitenant."""

    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime


class PaginatedResponse(ORMBaseSchema, Generic[T]):
    """Envelope padronizado para listagens paginadas."""

    items: list[T] = Field(description="Lista de itens da página atual.")
    total: int = Field(ge=0, description="Total de registros encontrados para o filtro.")
    skip: int = Field(ge=0, description="Deslocamento (offset) aplicado.")
    limit: int = Field(ge=1, description="Limite máximo de itens por página.")
