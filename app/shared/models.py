"""Modelos base e Mixins compartilhados para SQLAlchemy 2.0."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, MetaData, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def utc_now() -> datetime:
    """Retorna o timestamp atual em UTC."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Classe base declarativa do SQLAlchemy 2.0 com convenção de nomes para o Alembic."""

    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)


class UUIDPrimaryKeyMixin:
    """Mixin que define chave primária UUID v4 gerada automaticamente."""

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
        comment="Identificador único universal (UUID v4) do registro.",
    )


class TenantMixin:
    """Mixin obrigatório para isolamento multitenant por município/órgão público."""

    tenant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        nullable=False,
        index=True,
        comment="Identificador do Município/Ente Público proprietário do registro.",
    )


class TimestampMixin:
    """Mixin de auditoria temporal (criação e última atualização)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
        comment="Data e hora de criação do registro (UTC).",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
        nullable=False,
        comment="Data e hora da última atualização do registro (UTC).",
    )


class TenantEntityBase(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    """Classe abstrata base para todas as entidades multitenant do sistema."""

    __abstract__ = True
