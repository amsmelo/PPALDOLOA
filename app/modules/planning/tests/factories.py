"""Factories baseadas em factory-boy para geração de entidades de teste do Módulo de Planejamento."""

from decimal import Decimal
from uuid import uuid4

import factory

from app.modules.planning.models import (
    LDO,
    PPA,
    ActionType,
    GovernmentAction,
    GovernmentProgram,
    Indicator,
    IndicatorPeriodicity,
    LDOStatus,
    PPAStatus,
    ProgramType,
    StrategicAxis,
    StrategicObjective,
    Target,
)


class PPAFactory(factory.Factory):
    """Factory para criação de instâncias de PPA em memória ou payloads de teste."""

    class Meta:
        model = PPA

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"PPA 2026-2029 - Ciclo {n}")
    start_year = 2026
    end_year = 2029
    status = PPAStatus.ELABORACAO
    law_number = None
    law_date = None
    description = "Plano Plurianual Municipal Quadrienal"


class StrategicAxisFactory(factory.Factory):
    class Meta:
        model = StrategicAxis

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    ppa_id = factory.LazyFunction(uuid4)
    code = factory.Sequence(lambda n: f"EIXO-{n:02d}")
    name = factory.Sequence(lambda n: f"Eixo Estratégico {n}")
    description = "Descrição do Eixo Estratégico"


class StrategicObjectiveFactory(factory.Factory):
    class Meta:
        model = StrategicObjective

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    axis_id = factory.LazyFunction(uuid4)
    code = factory.Sequence(lambda n: f"OBJ-{n:02d}")
    title = factory.Sequence(lambda n: f"Objetivo Estratégico {n}")
    description = "Detalhamento do Objetivo Estratégico"


class GovernmentProgramFactory(factory.Factory):
    class Meta:
        model = GovernmentProgram

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    ppa_id = factory.LazyFunction(uuid4)
    objective_id = None
    code = factory.Sequence(lambda n: f"{n:04d}")
    title = factory.Sequence(lambda n: f"Programa Governamental {n}")
    justification = "Diagnóstico técnico do problema municipal"
    target_audience = "População geral do município"
    program_type = ProgramType.TEMATICO
    responsible_unit = "Secretaria Municipal de Planejamento"
    is_active = True


class IndicatorFactory(factory.Factory):
    class Meta:
        model = Indicator

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    program_id = factory.LazyFunction(uuid4)
    code = factory.Sequence(lambda n: f"IND-{n:03d}")
    name = factory.Sequence(lambda n: f"Indicador de Desempenho {n}")
    unit_of_measure = "Percentual (%)"
    formula = "(Realizado / Previsto) * 100"
    periodicity = IndicatorPeriodicity.ANUAL
    baseline_value = Decimal("50.0000")
    target_value = Decimal("85.0000")
    is_cumulative = False


class GovernmentActionFactory(factory.Factory):
    class Meta:
        model = GovernmentAction

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    program_id = factory.LazyFunction(uuid4)
    code = factory.Sequence(lambda n: f"{1000 + n}")
    title = factory.Sequence(lambda n: f"Ação Governamental {n}")
    description = "Entrega de infraestrutura e serviços à população"
    action_type = ActionType.PROJETO
    responsible_unit_code = "02.05.01"
    responsible_unit_name = "Secretaria Municipal de Educação"
    function_code = "12"
    subfunction_code = "361"
    product_name = "Unidade Escolar Construída"
    unit_of_measure = "Unidade"
    is_active = True


class TargetFactory(factory.Factory):
    class Meta:
        model = Target

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    action_id = factory.LazyFunction(uuid4)
    year = 2026
    physical_target = Decimal("10.0000")
    financial_target = Decimal("500000.00")
    executed_physical = Decimal("0.0000")
    executed_financial = Decimal("0.00")


class LDOFactory(factory.Factory):
    class Meta:
        model = LDO

    id = factory.LazyFunction(uuid4)
    tenant_id = factory.LazyFunction(uuid4)
    ppa_id = factory.LazyFunction(uuid4)
    fiscal_year = 2026
    status = LDOStatus.ELABORACAO
    primary_result_target = Decimal("150000.00")
    nominal_result_target = Decimal("100000.00")
