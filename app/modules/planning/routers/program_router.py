"""Endpoints RESTful para gerenciamento de Programas Governamentais, Ações, Indicadores e LDO."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DBSessionDep, TenantIdDep
from app.modules.planning.models.enums import ProgramType
from app.modules.planning.schemas import (
    GovernmentActionCreate,
    GovernmentActionRead,
    GovernmentProgramCreate,
    GovernmentProgramDetailRead,
    GovernmentProgramFilter,
    GovernmentProgramRead,
    GovernmentProgramUpdate,
    IndicatorCreate,
    IndicatorRead,
    LDOCreate,
    LDORead,
)
from app.modules.planning.services import GovernmentProgramService
from app.shared.schemas import PaginatedResponse

router = APIRouter(prefix="/programs", tags=["Planejamento - Programas Governamentais"])


def get_program_service(
    session: DBSessionDep,
    tenant_id: TenantIdDep,
) -> GovernmentProgramService:
    """Injeta a instância de GovernmentProgramService escopada ao município (tenant_id)."""
    return GovernmentProgramService(session=session, tenant_id=tenant_id)


ProgramServiceDep = Annotated[GovernmentProgramService, Depends(get_program_service)]


@router.post(
    "",
    response_model=GovernmentProgramDetailRead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Programa Governamental",
    description=(
        "Cadastra um Programa Governamental (Temático ou de Gestão/Manutenção) no PPA, "
        "permitindo incluir opcionalmente seus Indicadores, Ações e Metas Quadrienais."
    ),
)
async def create_program(
    payload: GovernmentProgramCreate,
    service: ProgramServiceDep,
) -> GovernmentProgramDetailRead:
    program = await service.create_program(payload)
    return GovernmentProgramDetailRead.model_validate(program)


@router.get(
    "",
    response_model=PaginatedResponse[GovernmentProgramRead],
    summary="Listar Programas Governamentais",
    description="Lista paginada de Programas Governamentais do município com filtros de busca.",
)
async def list_programs(
    service: ProgramServiceDep,
    ppa_id: Annotated[UUID | None, Query(description="Filtra pelo ciclo do PPA.")] = None,
    objective_id: Annotated[
        UUID | None, Query(description="Filtra pelo Objetivo Estratégico.")
    ] = None,
    program_type: Annotated[
        ProgramType | None, Query(description="Filtra pelo tipo do programa.")
    ] = None,
    is_active: Annotated[
        bool | None, Query(description="Filtra por status ativo/inativo.")
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Busca textual por código, título ou secretaria responsável."),
    ] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedResponse[GovernmentProgramRead]:
    filters = GovernmentProgramFilter(
        ppa_id=ppa_id,
        objective_id=objective_id,
        program_type=program_type,
        is_active=is_active,
        search=search,
        skip=skip,
        limit=limit,
    )
    items, total = await service.list_programs(filters)
    return PaginatedResponse[GovernmentProgramRead](
        items=[GovernmentProgramRead.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{program_id}",
    response_model=GovernmentProgramDetailRead,
    summary="Detalhar Programa Governamental",
    description="Retorna o Programa Governamental completo com Indicadores, Ações e Metas Físicas/Financeiras.",
)
async def get_program(
    program_id: UUID,
    service: ProgramServiceDep,
) -> GovernmentProgramDetailRead:
    program = await service.get_program_detail(program_id)
    return GovernmentProgramDetailRead.model_validate(program)


@router.patch(
    "/{program_id}",
    response_model=GovernmentProgramDetailRead,
    summary="Atualizar Programa Governamental (parcial)",
    description="Atualiza parcialmente os dados cadastrais de um Programa Governamental.",
)
@router.put(
    "/{program_id}",
    response_model=GovernmentProgramDetailRead,
    summary="Atualizar Programa Governamental",
    include_in_schema=False,
)
async def update_program(
    program_id: UUID,
    payload: GovernmentProgramUpdate,
    service: ProgramServiceDep,
) -> GovernmentProgramDetailRead:
    program = await service.update_program(program_id, payload)
    return GovernmentProgramDetailRead.model_validate(program)


@router.delete(
    "/{program_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Programa Governamental",
    description="Remove um Programa Governamental e suas dependências (permitido em PPAs não encerrados).",
)
async def delete_program(
    program_id: UUID,
    service: ProgramServiceDep,
) -> None:
    await service.delete_program(program_id)


@router.post(
    "/indicators",
    response_model=IndicatorRead,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Indicador a um Programa",
    description="Vincula um novo Indicador de Desempenho a um Programa Governamental existente.",
)
async def add_indicator(
    payload: IndicatorCreate,
    service: ProgramServiceDep,
) -> IndicatorRead:
    indicator = await service.add_indicator(payload)
    return IndicatorRead.model_validate(indicator)


@router.post(
    "/actions",
    response_model=GovernmentActionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Ação Governamental e Metas a um Programa",
    description="Cadastra uma Ação Governamental (Projeto, Atividade ou Operação Especial) e suas metas anuais.",
)
async def add_action(
    payload: GovernmentActionCreate,
    service: ProgramServiceDep,
) -> GovernmentActionRead:
    action = await service.add_action(payload)
    return GovernmentActionRead.model_validate(action)


@router.post(
    "/ldos",
    response_model=LDORead,
    status_code=status.HTTP_201_CREATED,
    summary="Criar LDO e Anexo de Metas e Prioridades",
    description="Cadastra a LDO de um exercício financeiro anual vinculando as Ações Prioritárias do PPA.",
)
async def create_ldo(
    payload: LDOCreate,
    service: ProgramServiceDep,
) -> LDORead:
    ldo = await service.create_ldo(payload)
    return LDORead.model_validate(ldo)
