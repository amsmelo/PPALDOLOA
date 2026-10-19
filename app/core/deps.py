"""Dependências reutilizáveis do FastAPI (Sessão de Banco e Contexto Multitenant)."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session


async def get_current_tenant_id(
    x_tenant_id: Annotated[
        UUID,
        Header(
            alias="X-Tenant-ID",
            description="Identificador UUID do Município / Entidade Pública (Tenant).",
        ),
    ],
) -> UUID:
    """Extrai e valida o identificador do município (tenant_id) a partir do cabeçalho HTTP."""
    if x_tenant_id.int == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O cabeçalho X-Tenant-ID não pode conter um UUID nulo.",
        )
    return x_tenant_id


DBSessionDep = Annotated[AsyncSession, Depends(get_db_session)]
TenantIdDep = Annotated[UUID, Depends(get_current_tenant_id)]
