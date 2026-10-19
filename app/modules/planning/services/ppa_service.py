"""Camada de serviço e regras de negócio para gestão de Ciclos do PPA, Eixos e Objetivos."""

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.planning.models import (
    PPA,
    PPAStatus,
    StrategicAxis,
    StrategicObjective,
)
from app.modules.planning.schemas import (
    PPACreate,
    PPAFilter,
    PPAUpdate,
    StrategicAxisCreate,
    StrategicObjectiveCreate,
)
from app.shared.exceptions import (
    BusinessRuleViolationError,
    DuplicateEntityError,
    EntityNotFoundError,
)


class PPAService:
    """Casos de uso e validações de domínio para o Plano Plurianual (PPA)."""

    def __init__(self, session: AsyncSession, tenant_id: UUID) -> None:
        self.session = session
        self.tenant_id = tenant_id

    async def create_ppa(self, payload: PPACreate) -> PPA:
        """Cria um novo ciclo quadrienal de PPA para o município."""
        existing = await self.session.scalar(
            select(PPA).where(
                PPA.tenant_id == self.tenant_id,
                PPA.start_year == payload.start_year,
                PPA.end_year == payload.end_year,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe um PPA cadastrado para o quadriênio "
                f"{payload.start_year}-{payload.end_year} neste município."
            )

        ppa = PPA(
            tenant_id=self.tenant_id,
            name=payload.name,
            start_year=payload.start_year,
            end_year=payload.end_year,
            status=payload.status,
            law_number=payload.law_number,
            law_date=payload.law_date,
            description=payload.description,
        )
        self.session.add(ppa)
        await self.session.commit()
        await self.session.refresh(ppa)
        return ppa

    async def list_ppas(self, filters: PPAFilter) -> tuple[list[PPA], int]:
        """Lista os ciclos de PPA do município com suporte a filtros e paginação."""
        conditions = [PPA.tenant_id == self.tenant_id]

        if filters.status is not None:
            conditions.append(PPA.status == filters.status)

        if filters.reference_year is not None:
            conditions.append(PPA.start_year <= filters.reference_year)
            conditions.append(PPA.end_year >= filters.reference_year)

        if filters.search:
            term = f"%{filters.search}%"
            conditions.append(
                or_(
                    PPA.name.ilike(term),
                    PPA.law_number.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(PPA).where(*conditions)
        total = (await self.session.scalar(count_stmt)) or 0

        stmt = (
            select(PPA)
            .where(*conditions)
            .order_by(PPA.start_year.desc(), PPA.created_at.desc())
            .offset(filters.skip)
            .limit(filters.limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all()), total

    async def get_ppa(self, ppa_id: UUID) -> PPA:
        """Busca um PPA pelo ID garantindo o isolamento por tenant_id."""
        ppa = await self.session.scalar(
            select(PPA).where(
                PPA.id == ppa_id,
                PPA.tenant_id == self.tenant_id,
            )
        )
        if ppa is None:
            raise EntityNotFoundError("PPA", ppa_id)
        return ppa

    async def get_ppa_detail(self, ppa_id: UUID) -> PPA:
        """Busca um PPA com carregamento ansioso (eager loading) de Eixos e Objetivos."""
        ppa = await self.session.scalar(
            select(PPA)
            .where(
                PPA.id == ppa_id,
                PPA.tenant_id == self.tenant_id,
            )
            .options(
                selectinload(PPA.strategic_axes).selectinload(StrategicAxis.objectives)
            )
        )
        if ppa is None:
            raise EntityNotFoundError("PPA", ppa_id)
        return ppa

    async def update_ppa(self, ppa_id: UUID, payload: PPAUpdate) -> PPA:
        """Atualiza dados de um ciclo de PPA respeitando as regras de transição e vigência."""
        ppa = await self.get_ppa(ppa_id)

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return ppa

        if ppa.status == PPAStatus.ENCERRADO:
            raise BusinessRuleViolationError(
                "Não é permitido alterar um ciclo de PPA que já se encontra ENCERRADO."
            )

        new_start = update_data.get("start_year", ppa.start_year)
        new_end = update_data.get("end_year", ppa.end_year)
        if new_end != new_start + 3:
            raise BusinessRuleViolationError(
                f"Vigência quadrienal inválida: o ano final ({new_end}) deve ser "
                f"exatamente igual ao ano inicial + 3 ({new_start + 3})."
            )

        if (new_start, new_end) != (ppa.start_year, ppa.end_year):
            conflict = await self.session.scalar(
                select(PPA).where(
                    PPA.tenant_id == self.tenant_id,
                    PPA.start_year == new_start,
                    PPA.end_year == new_end,
                    PPA.id != ppa.id,
                )
            )
            if conflict is not None:
                raise DuplicateEntityError(
                    f"Já existe outro PPA cadastrado para o período {new_start}-{new_end}."
                )

        new_status = update_data.get("status", ppa.status)
        new_law = update_data.get("law_number", ppa.law_number)
        if new_status in (PPAStatus.APROVADO, PPAStatus.EM_EXECUCAO) and not new_law:
            raise BusinessRuleViolationError(
                "Para transicionar o PPA para APROVADO ou EM_EXECUCAO, é obrigatório "
                "informar o número da Lei Municipal (law_number)."
            )

        for field, value in update_data.items():
            setattr(ppa, field, value)

        await self.session.commit()
        await self.session.refresh(ppa)
        return ppa

    async def delete_ppa(self, ppa_id: UUID) -> None:
        """Remove um ciclo de PPA (permitido apenas enquanto estiver EM ELABORAÇÃO)."""
        ppa = await self.get_ppa(ppa_id)
        if ppa.status != PPAStatus.ELABORACAO:
            raise BusinessRuleViolationError(
                f"Não é permitido excluir um PPA com status '{ppa.status}'. "
                "Apenas PPAs em fase de ELABORACAO podem ser excluídos."
            )
        await self.session.delete(ppa)
        await self.session.commit()

    async def create_strategic_axis(self, payload: StrategicAxisCreate) -> StrategicAxis:
        """Cria um Eixo Estratégico vinculado a um PPA do município."""
        ppa = await self.get_ppa(payload.ppa_id)
        if ppa.status == PPAStatus.ENCERRADO:
            raise BusinessRuleViolationError(
                "Não é possível adicionar eixos estratégicos a um PPA encerrado."
            )

        existing = await self.session.scalar(
            select(StrategicAxis).where(
                StrategicAxis.tenant_id == self.tenant_id,
                StrategicAxis.ppa_id == payload.ppa_id,
                StrategicAxis.code == payload.code,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe um Eixo Estratégico com o código '{payload.code}' neste PPA."
            )

        axis = StrategicAxis(
            tenant_id=self.tenant_id,
            ppa_id=payload.ppa_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
        )
        self.session.add(axis)
        await self.session.commit()

        return await self.session.scalar(
            select(StrategicAxis)
            .where(StrategicAxis.id == axis.id)
            .options(selectinload(StrategicAxis.objectives))
        )  # type: ignore[return-value]

    async def create_strategic_objective(
        self, payload: StrategicObjectiveCreate
    ) -> StrategicObjective:
        """Cria um Objetivo Estratégico vinculado a um Eixo Estratégico do município."""
        axis = await self.session.scalar(
            select(StrategicAxis).where(
                StrategicAxis.id == payload.axis_id,
                StrategicAxis.tenant_id == self.tenant_id,
            )
        )
        if axis is None:
            raise EntityNotFoundError("Eixo Estratégico", payload.axis_id)

        existing = await self.session.scalar(
            select(StrategicObjective).where(
                StrategicObjective.tenant_id == self.tenant_id,
                StrategicObjective.axis_id == payload.axis_id,
                StrategicObjective.code == payload.code,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe um Objetivo Estratégico com o código '{payload.code}' neste eixo."
            )

        objective = StrategicObjective(
            tenant_id=self.tenant_id,
            axis_id=payload.axis_id,
            code=payload.code,
            title=payload.title,
            description=payload.description,
        )
        self.session.add(objective)
        await self.session.commit()
        await self.session.refresh(objective)
        return objective
