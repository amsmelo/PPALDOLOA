"""Camada de serviço e regras de negócio para Programas Governamentais, Ações, Indicadores e LDO."""

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.planning.models import (
    LDO,
    PPA,
    GovernmentAction,
    GovernmentProgram,
    Indicator,
    LDOItem,
    PPAStatus,
    StrategicAxis,
    StrategicObjective,
    Target,
)
from app.modules.planning.schemas import (
    GovernmentActionCreate,
    GovernmentProgramCreate,
    GovernmentProgramFilter,
    GovernmentProgramUpdate,
    IndicatorCreate,
    LDOCreate,
)
from app.shared.exceptions import (
    BusinessRuleViolationError,
    DuplicateEntityError,
    EntityNotFoundError,
)


class GovernmentProgramService:
    """Casos de uso para gerenciamento de Programas Governamentais e sua cadeia de valor."""

    def __init__(self, session: AsyncSession, tenant_id: UUID) -> None:
        self.session = session
        self.tenant_id = tenant_id

    async def _validate_ppa_and_objective(
        self, ppa_id: UUID, objective_id: UUID | None
    ) -> PPA:
        """Valida se o PPA e o Objetivo Estratégico existem no tenant e são compatíveis."""
        ppa = await self.session.scalar(
            select(PPA).where(
                PPA.id == ppa_id,
                PPA.tenant_id == self.tenant_id,
            )
        )
        if ppa is None:
            raise EntityNotFoundError("PPA", ppa_id)

        if ppa.status == PPAStatus.ENCERRADO:
            raise BusinessRuleViolationError(
                "Não é permitido criar ou modificar programas em um PPA ENCERRADO."
            )

        if objective_id is not None:
            objective = await self.session.scalar(
                select(StrategicObjective)
                .join(StrategicAxis, StrategicObjective.axis_id == StrategicAxis.id)
                .where(
                    StrategicObjective.id == objective_id,
                    StrategicObjective.tenant_id == self.tenant_id,
                    StrategicAxis.ppa_id == ppa_id,
                )
            )
            if objective is None:
                raise BusinessRuleViolationError(
                    f"O Objetivo Estratégico '{objective_id}' não existe ou não pertence "
                    f"ao ciclo de PPA '{ppa.name}' ({ppa.start_year}-{ppa.end_year})."
                )

        return ppa

    async def create_program(self, payload: GovernmentProgramCreate) -> GovernmentProgram:
        """Cria um Programa Governamental (e opcionalmente seus Indicadores, Ações e Metas)."""
        ppa = await self._validate_ppa_and_objective(payload.ppa_id, payload.objective_id)

        existing = await self.session.scalar(
            select(GovernmentProgram).where(
                GovernmentProgram.tenant_id == self.tenant_id,
                GovernmentProgram.ppa_id == payload.ppa_id,
                GovernmentProgram.code == payload.code,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe um Programa Governamental com o código '{payload.code}' "
                f"no PPA {ppa.start_year}-{ppa.end_year}."
            )

        # Valida se todos os anos de metas aninhadas pertencem ao quadriênio do PPA
        for action_in in payload.actions:
            for target_in in action_in.targets:
                if not (ppa.start_year <= target_in.year <= ppa.end_year):
                    raise BusinessRuleViolationError(
                        f"O ano da meta ({target_in.year}) na ação '{action_in.code}' "
                        f"está fora da vigência do PPA ({ppa.start_year}-{ppa.end_year})."
                    )

        program = GovernmentProgram(
            tenant_id=self.tenant_id,
            ppa_id=payload.ppa_id,
            objective_id=payload.objective_id,
            code=payload.code,
            title=payload.title,
            justification=payload.justification,
            target_audience=payload.target_audience,
            program_type=payload.program_type,
            responsible_unit=payload.responsible_unit,
            is_active=payload.is_active,
        )

        for ind_in in payload.indicators:
            program.indicators.append(
                Indicator(
                    tenant_id=self.tenant_id,
                    code=ind_in.code,
                    name=ind_in.name,
                    unit_of_measure=ind_in.unit_of_measure,
                    formula=ind_in.formula,
                    periodicity=ind_in.periodicity,
                    baseline_value=ind_in.baseline_value,
                    baseline_date=ind_in.baseline_date,
                    target_value=ind_in.target_value,
                    is_cumulative=ind_in.is_cumulative,
                )
            )

        for action_in in payload.actions:
            action_entity = GovernmentAction(
                tenant_id=self.tenant_id,
                code=action_in.code,
                title=action_in.title,
                description=action_in.description,
                action_type=action_in.action_type,
                responsible_unit_code=action_in.responsible_unit_code,
                responsible_unit_name=action_in.responsible_unit_name,
                function_code=action_in.function_code,
                subfunction_code=action_in.subfunction_code,
                product_name=action_in.product_name,
                unit_of_measure=action_in.unit_of_measure,
                is_active=action_in.is_active,
            )
            for target_in in action_in.targets:
                action_entity.targets.append(
                    Target(
                        tenant_id=self.tenant_id,
                        year=target_in.year,
                        physical_target=target_in.physical_target,
                        financial_target=target_in.financial_target,
                        executed_physical=target_in.executed_physical,
                        executed_financial=target_in.executed_financial,
                        notes=target_in.notes,
                    )
                )
            program.actions.append(action_entity)

        self.session.add(program)
        await self.session.commit()
        return await self.get_program_detail(program.id)

    async def list_programs(
        self, filters: GovernmentProgramFilter
    ) -> tuple[list[GovernmentProgram], int]:
        """Lista os Programas Governamentais do município com filtros e paginação."""
        conditions = [GovernmentProgram.tenant_id == self.tenant_id]

        if filters.ppa_id is not None:
            conditions.append(GovernmentProgram.ppa_id == filters.ppa_id)
        if filters.objective_id is not None:
            conditions.append(GovernmentProgram.objective_id == filters.objective_id)
        if filters.program_type is not None:
            conditions.append(GovernmentProgram.program_type == filters.program_type)
        if filters.is_active is not None:
            conditions.append(GovernmentProgram.is_active == filters.is_active)
        if filters.search:
            term = f"%{filters.search}%"
            conditions.append(
                or_(
                    GovernmentProgram.code.ilike(term),
                    GovernmentProgram.title.ilike(term),
                    GovernmentProgram.responsible_unit.ilike(term),
                )
            )

        count_stmt = (
            select(func.count()).select_from(GovernmentProgram).where(*conditions)
        )
        total = (await self.session.scalar(count_stmt)) or 0

        stmt = (
            select(GovernmentProgram)
            .where(*conditions)
            .order_by(GovernmentProgram.code.asc(), GovernmentProgram.created_at.desc())
            .offset(filters.skip)
            .limit(filters.limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all()), total

    async def get_program(self, program_id: UUID) -> GovernmentProgram:
        """Obtém um Programa Governamental pelo ID garantindo isolamento por tenant."""
        program = await self.session.scalar(
            select(GovernmentProgram).where(
                GovernmentProgram.id == program_id,
                GovernmentProgram.tenant_id == self.tenant_id,
            )
        )
        if program is None:
            raise EntityNotFoundError("Programa Governamental", program_id)
        return program

    async def get_program_detail(self, program_id: UUID) -> GovernmentProgram:
        """Obtém o Programa Governamental com Indicadores, Ações e Metas carregados."""
        program = await self.session.scalar(
            select(GovernmentProgram)
            .where(
                GovernmentProgram.id == program_id,
                GovernmentProgram.tenant_id == self.tenant_id,
            )
            .options(
                selectinload(GovernmentProgram.indicators),
                selectinload(GovernmentProgram.actions).selectinload(
                    GovernmentAction.targets
                ),
            )
        )
        if program is None:
            raise EntityNotFoundError("Programa Governamental", program_id)
        return program

    async def update_program(
        self, program_id: UUID, payload: GovernmentProgramUpdate
    ) -> GovernmentProgram:
        """Atualiza os atributos de um Programa Governamental."""
        program = await self.get_program(program_id)

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_program_detail(program.id)

        target_objective_id = update_data.get("objective_id", program.objective_id)
        await self._validate_ppa_and_objective(program.ppa_id, target_objective_id)

        new_code = update_data.get("code")
        if new_code and new_code != program.code:
            conflict = await self.session.scalar(
                select(GovernmentProgram).where(
                    GovernmentProgram.tenant_id == self.tenant_id,
                    GovernmentProgram.ppa_id == program.ppa_id,
                    GovernmentProgram.code == new_code,
                    GovernmentProgram.id != program.id,
                )
            )
            if conflict is not None:
                raise DuplicateEntityError(
                    f"Já existe outro Programa Governamental com o código '{new_code}' neste PPA."
                )

        for field, value in update_data.items():
            setattr(program, field, value)

        await self.session.commit()
        return await self.get_program_detail(program.id)

    async def delete_program(self, program_id: UUID) -> None:
        """Exclui um Programa Governamental (desde que o PPA não esteja encerrado)."""
        program = await self.get_program(program_id)
        ppa = await self.session.scalar(
            select(PPA).where(PPA.id == program.ppa_id, PPA.tenant_id == self.tenant_id)
        )
        if ppa and ppa.status == PPAStatus.ENCERRADO:
            raise BusinessRuleViolationError(
                "Não é permitido excluir um Programa Governamental de um PPA ENCERRADO."
            )

        await self.session.delete(program)
        await self.session.commit()

    async def add_indicator(self, payload: IndicatorCreate) -> Indicator:
        """Adiciona um novo Indicador a um Programa Governamental existente."""
        program = await self.get_program(payload.program_id)
        await self._validate_ppa_and_objective(program.ppa_id, program.objective_id)

        existing = await self.session.scalar(
            select(Indicator).where(
                Indicator.tenant_id == self.tenant_id,
                Indicator.program_id == payload.program_id,
                Indicator.code == payload.code,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe um Indicador com o código '{payload.code}' neste programa."
            )

        indicator = Indicator(
            tenant_id=self.tenant_id,
            program_id=payload.program_id,
            code=payload.code,
            name=payload.name,
            unit_of_measure=payload.unit_of_measure,
            formula=payload.formula,
            periodicity=payload.periodicity,
            baseline_value=payload.baseline_value,
            baseline_date=payload.baseline_date,
            target_value=payload.target_value,
            is_cumulative=payload.is_cumulative,
        )
        self.session.add(indicator)
        await self.session.commit()
        await self.session.refresh(indicator)
        return indicator

    async def add_action(self, payload: GovernmentActionCreate) -> GovernmentAction:
        """Adiciona uma Ação Governamental e suas metas anuais a um Programa existente."""
        program = await self.get_program(payload.program_id)
        ppa = await self._validate_ppa_and_objective(program.ppa_id, program.objective_id)

        existing = await self.session.scalar(
            select(GovernmentAction).where(
                GovernmentAction.tenant_id == self.tenant_id,
                GovernmentAction.program_id == payload.program_id,
                GovernmentAction.code == payload.code,
            )
        )
        if existing is not None:
            raise DuplicateEntityError(
                f"Já existe uma Ação Governamental com o código '{payload.code}' neste programa."
            )

        for target_in in payload.targets:
            if not (ppa.start_year <= target_in.year <= ppa.end_year):
                raise BusinessRuleViolationError(
                    f"O ano da meta ({target_in.year}) está fora da vigência do PPA "
                    f"({ppa.start_year}-{ppa.end_year})."
                )

        action = GovernmentAction(
            tenant_id=self.tenant_id,
            program_id=payload.program_id,
            code=payload.code,
            title=payload.title,
            description=payload.description,
            action_type=payload.action_type,
            responsible_unit_code=payload.responsible_unit_code,
            responsible_unit_name=payload.responsible_unit_name,
            function_code=payload.function_code,
            subfunction_code=payload.subfunction_code,
            product_name=payload.product_name,
            unit_of_measure=payload.unit_of_measure,
            is_active=payload.is_active,
        )
        for target_in in payload.targets:
            action.targets.append(
                Target(
                    tenant_id=self.tenant_id,
                    year=target_in.year,
                    physical_target=target_in.physical_target,
                    financial_target=target_in.financial_target,
                    executed_physical=target_in.executed_physical,
                    executed_financial=target_in.executed_financial,
                    notes=target_in.notes,
                )
            )

        self.session.add(action)
        await self.session.commit()

        return await self.session.scalar(
            select(GovernmentAction)
            .where(GovernmentAction.id == action.id)
            .options(selectinload(GovernmentAction.targets))
        )  # type: ignore[return-value]

    async def create_ldo(self, payload: LDOCreate) -> LDO:
        """Cria a LDO anual vinculada ao PPA e registra as Ações Prioritárias do exercício."""
        ppa = await self.session.scalar(
            select(PPA).where(
                PPA.id == payload.ppa_id,
                PPA.tenant_id == self.tenant_id,
            )
        )
        if ppa is None:
            raise EntityNotFoundError("PPA", payload.ppa_id)

        if not (ppa.start_year <= payload.fiscal_year <= ppa.end_year):
            raise BusinessRuleViolationError(
                f"O exercício financeiro da LDO ({payload.fiscal_year}) deve estar contido "
                f"no período de vigência do PPA ({ppa.start_year}-{ppa.end_year})."
            )

        existing_ldo = await self.session.scalar(
            select(LDO).where(
                LDO.tenant_id == self.tenant_id,
                LDO.fiscal_year == payload.fiscal_year,
            )
        )
        if existing_ldo is not None:
            raise DuplicateEntityError(
                f"Já existe uma LDO cadastrada para o exercício de {payload.fiscal_year}."
            )

        ldo = LDO(
            tenant_id=self.tenant_id,
            ppa_id=payload.ppa_id,
            fiscal_year=payload.fiscal_year,
            status=payload.status,
            law_number=payload.law_number,
            law_date=payload.law_date,
            primary_result_target=payload.primary_result_target,
            nominal_result_target=payload.nominal_result_target,
            notes=payload.notes,
        )

        for item_in in payload.items:
            action = await self.session.scalar(
                select(GovernmentAction)
                .join(
                    GovernmentProgram,
                    GovernmentAction.program_id == GovernmentProgram.id,
                )
                .where(
                    GovernmentAction.id == item_in.action_id,
                    GovernmentAction.tenant_id == self.tenant_id,
                    GovernmentProgram.ppa_id == payload.ppa_id,
                )
            )
            if action is None:
                raise BusinessRuleViolationError(
                    f"A Ação Governamental '{item_in.action_id}' não existe ou não pertence "
                    f"ao PPA '{ppa.name}'."
                )

            ldo.items.append(
                LDOItem(
                    tenant_id=self.tenant_id,
                    action_id=item_in.action_id,
                    priority_level=item_in.priority_level,
                    adjusted_physical_target=item_in.adjusted_physical_target,
                    adjusted_financial_target=item_in.adjusted_financial_target,
                    justification=item_in.justification,
                )
            )

        self.session.add(ldo)
        await self.session.commit()

        return await self.session.scalar(
            select(LDO).where(LDO.id == ldo.id).options(selectinload(LDO.items))
        )  # type: ignore[return-value]
