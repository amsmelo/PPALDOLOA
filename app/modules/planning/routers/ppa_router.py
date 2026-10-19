"""Endpoints RESTful para gerenciamento de Ciclos de PPA, Eixos e Objetivos Estratégicos."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DBSessionDep, TenantIdDep
from app.modules.planning.models.enums import PPAStatus
from app.modules.planning.schemas import (
    PPACreate,
    PPADetailRead,
    PPAFilter,
    PPARead,
    PPAUpdate,
    StrategicAxisCreate,
    StrategicAxisRead,
    StrategicObjectiveCreate,
    StrategicObjectiveRead,
)
from app.modules.planning.services import PPAService
from app.shared.schemas import PaginatedResponse

router = APIRouter(prefix="/ppas", tags=["Planejamento - Ciclos de PPA"])


def get_ppa_service(
    session: DBSessionDep,
    tenant_id: TenantIdDep,
) -> PPAService:
    """Injeta a instância de PPAService escopada ao município (tenant_id)."""
    return PPAService(session=session, tenant_id=tenant_id)


PPAServiceDep = Annotated[PPAService, Depends(get_ppa_service)]


@router.post(
    "",
    response_model=PPARead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo ciclo de PPA",
    description="Cadastra um novo Plano Plurianual quadrienal (4 anos) para o município.",
)
async def create_ppa(
    payload: PPACreate,
    service: PPAServiceDep,
) -> PPARead:
    ppa = await service.create_ppa(payload)
    return PPARead.model_validate(ppa)


@router.get(
    "",
    response_model=PaginatedResponse[PPARead],
    summary="Listar ciclos de PPA",
    description="Retorna a lista paginada de PPAs do município com filtros por status, ano e busca textual.",
)
async def list_ppas(
    service: PPAServiceDep,
    status_filter: Annotated[
        PPAStatus | None,
        Query(alias="status", description="Filtra pelo status do ciclo do PPA."),
    ] = None,
    reference_year: Annotated[
        int | None,
        Query(ge=2000, le=2103, description="Filtra PPAs vigentes no ano informado."),
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Busca parcial por título ou número da lei."),
    ] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedResponse[PPARead]:
    filters = PPAFilter(
        status=status_filter,
        reference_year=reference_year,
        search=search,
        skip=skip,
        limit=limit,
    )
    items, total = await service.list_ppas(filters)
    return PaginatedResponse[PPARead](
        items=[PPARead.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{ppa_id}",
    response_model=PPADetailRead,
    summary="Detalhar ciclo de PPA",
    description="Retorna os dados completos de um ciclo de PPA, incluindo seus Eixos e Objetivos Estratégicos.",
)
async def get_ppa(
    ppa_id: UUID,
    service: PPAServiceDep,
) -> PPADetailRead:
    ppa = await service.get_ppa_detail(ppa_id)
    return PPADetailRead.model_validate(ppa)


@router.patch(
    "/{ppa_id}",
    response_model=PPARead,
    summary="Atualizar ciclo de PPA (parcial)",
    description="Atualiza parcialmente os dados ou o status de um ciclo de PPA.",
)
@router.put(
    "/{ppa_id}",
    response_model=PPARead,
    summary="Atualizar ciclo de PPA",
    include_in_schema=False,
)
async def update_ppa(
    ppa_id: UUID,
    payload: PPAUpdate,
    service: PPAServiceDep,
) -> PPARead:
    ppa = await service.update_ppa(ppa_id, payload)
    return PPARead.model_validate(ppa)


@router.delete(
    "/{ppa_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir ciclo de PPA",
    description="Remove um ciclo de PPA (permitido apenas se o status for ELABORACAO).",
)
async def delete_ppa(
    ppa_id: UUID,
    service: PPAServiceDep,
) -> None:
    await service.delete_ppa(ppa_id)


@router.post(
    "/axes",
    response_model=StrategicAxisRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Eixo Estratégico no PPA",
    description="Registra um novo Eixo Estratégico vinculado a um ciclo de PPA do município.",
)
async def create_strategic_axis(
    payload: StrategicAxisCreate,
    service: PPAServiceDep,
) -> StrategicAxisRead:
    axis = await service.create_strategic_axis(payload)
    return StrategicAxisRead.model_validate(axis)


@router.post(
    "/objectives",
    response_model=StrategicObjectiveRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Objetivo Estratégico em um Eixo",
    description="Registra um Objetivo Estratégico vinculado a um Eixo Estratégico do PPA.",
)
async def create_strategic_objective(
    payload: StrategicObjectiveCreate,
    service: PPAServiceDep,
) -> StrategicObjectiveRead:
    objective = await service.create_strategic_objective(payload)
    return StrategicObjectiveRead.model_validate(objective)
