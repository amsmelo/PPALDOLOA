"""Modelos SQLAlchemy 2.0 do Módulo 1: Planejamento Municipal (PPA e LDO)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.planning.models.enums import (
    ActionType,
    IndicatorPeriodicity,
    LDOStatus,
    PPAStatus,
    ProgramType,
)
from app.shared.models import TenantEntityBase


class PPA(TenantEntityBase):
    """Plano Plurianual (PPA) — Instrumento de planejamento estratégico quadrienal."""

    __tablename__ = "planning_ppas"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "start_year",
            "end_year",
            name="uq_planning_ppas_tenant_period",
        ),
        CheckConstraint(
            "end_year = start_year + 3",
            name="ppa_quadrennial_period",
        ),
        CheckConstraint(
            "start_year >= 2000 AND start_year <= 2100",
            name="ppa_valid_start_year",
        ),
        Index("ix_planning_ppas_tenant_status", "tenant_id", "status"),
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Título de identificação do PPA (ex.: PPA 2026-2029 - Cidade Sustentável).",
    )
    start_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Ano inicial de vigência do quadriênio (ex.: 2026).",
    )
    end_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Ano final de vigência do quadriênio (ex.: 2029).",
    )
    status: Mapped[PPAStatus] = mapped_column(
        SAEnum(PPAStatus, name="ppa_status_enum", native_enum=False, length=30),
        default=PPAStatus.ELABORACAO,
        nullable=False,
        comment="Status atual do ciclo do PPA.",
    )
    law_number: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
        comment="Número da Lei Municipal que aprovou o PPA.",
    )
    law_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        comment="Data de sanção/publicação da Lei do PPA.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Mensagem de encaminhamento, diretrizes gerais ou resumo executivo.",
    )

    # Relacionamentos
    strategic_axes: Mapped[list["StrategicAxis"]] = relationship(
        "StrategicAxis",
        back_populates="ppa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    programs: Mapped[list["GovernmentProgram"]] = relationship(
        "GovernmentProgram",
        back_populates="ppa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    ldos: Mapped[list["LDO"]] = relationship(
        "LDO",
        back_populates="ppa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StrategicAxis(TenantEntityBase):
    """Eixo Estratégico — Macroagrupador temático do Plano de Governo no PPA."""

    __tablename__ = "planning_strategic_axes"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "ppa_id",
            "code",
            name="uq_planning_axes_tenant_ppa_code",
        ),
    )

    ppa_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_ppas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Referência ao PPA ao qual o eixo pertence.",
    )
    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Código do Eixo Estratégico (ex.: EIXO-01).",
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Denominação do Eixo Estratégico (ex.: Desenvolvimento Social e Saúde).",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Descrição detalhada da visão estratégica do eixo.",
    )

    # Relacionamentos
    ppa: Mapped["PPA"] = relationship("PPA", back_populates="strategic_axes")
    objectives: Mapped[list["StrategicObjective"]] = relationship(
        "StrategicObjective",
        back_populates="axis",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StrategicObjective(TenantEntityBase):
    """Objetivo Estratégico — Resultado prioritário almejado dentro de um Eixo Estratégico."""

    __tablename__ = "planning_strategic_objectives"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "axis_id",
            "code",
            name="uq_planning_objectives_tenant_axis_code",
        ),
    )

    axis_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_strategic_axes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Referência ao Eixo Estratégico pai.",
    )
    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Código do Objetivo Estratégico (ex.: OBJ-01.01).",
    )
    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        comment="Enunciado do Objetivo Estratégico.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Detalhamento dos desafios e resultados esperados.",
    )

    # Relacionamentos
    axis: Mapped["StrategicAxis"] = relationship("StrategicAxis", back_populates="objectives")
    programs: Mapped[list["GovernmentProgram"]] = relationship(
        "GovernmentProgram",
        back_populates="objective",
    )


class GovernmentProgram(TenantEntityBase):
    """Programa Governamental — Elo entre o planejamento estratégico (PPA) e o orçamento (LOA)."""

    __tablename__ = "planning_government_programs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "ppa_id",
            "code",
            name="uq_planning_programs_tenant_ppa_code",
        ),
        Index("ix_planning_programs_tenant_type", "tenant_id", "program_type"),
    )

    ppa_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_ppas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Referência ao ciclo do PPA.",
    )
    objective_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_strategic_objectives.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Objetivo Estratégico vinculado (opcional para programas de gestão/manutenção).",
    )
    code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="Código oficial do Programa no PPA/LOA (ex.: 0001, 0012).",
    )
    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        comment="Denominação oficial do Programa Governamental.",
    )
    justification: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Diagnóstico da situação-problema que justifica a existência do programa.",
    )
    target_audience: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        comment="Público-alvo direto beneficiado pelas entregas do programa.",
    )
    program_type: Mapped[ProgramType] = mapped_column(
        SAEnum(ProgramType, name="program_type_enum", native_enum=False, length=30),
        nullable=False,
        default=ProgramType.TEMATICO,
        comment="Tipo de programa: TEMATICO ou GESTAO_MANUTENCAO.",
    )
    responsible_unit: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Órgão ou Secretaria Municipal coordenadora do programa.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Indica se o programa está ativo para vinculação de ações e dotações.",
    )

    # Relacionamentos
    ppa: Mapped["PPA"] = relationship("PPA", back_populates="programs")
    objective: Mapped["StrategicObjective | None"] = relationship(
        "StrategicObjective",
        back_populates="programs",
    )
    actions: Mapped[list["GovernmentAction"]] = relationship(
        "GovernmentAction",
        back_populates="program",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    indicators: Mapped[list["Indicator"]] = relationship(
        "Indicator",
        back_populates="program",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Indicator(TenantEntityBase):
    """Indicador de Desempenho — Instrumento de aferição de eficácia e efetividade de um Programa."""

    __tablename__ = "planning_indicators"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "program_id",
            "code",
            name="uq_planning_indicators_tenant_program_code",
        ),
    )

    program_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_government_programs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Programa Governamental mensurado por este indicador.",
    )
    code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        comment="Código interno do indicador (ex.: IND-EDU-01).",
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Nome descritivo do indicador (ex.: Taxa de Escolarização Líquida).",
    )
    unit_of_measure: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Unidade de medida (ex.: Percentual %, Taxa por 1.000 hab., Índice).",
    )
    formula: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Fórmula matemática ou método de cálculo para apuração periódica.",
    )
    periodicity: Mapped[IndicatorPeriodicity] = mapped_column(
        SAEnum(
            IndicatorPeriodicity,
            name="indicator_periodicity_enum",
            native_enum=False,
            length=30,
        ),
        default=IndicatorPeriodicity.ANUAL,
        nullable=False,
        comment="Periodicidade de coleta e apuração do indicador.",
    )
    baseline_value: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
        default=Decimal("0.0000"),
        comment="Valor da linha de base (situação inicial antes do PPA).",
    )
    baseline_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        comment="Data de referência da linha de base.",
    )
    target_value: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
        comment="Meta final esperada ao término do quadriênio do PPA.",
    )
    is_cumulative: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Define se a meta é cumulativa ao longo dos anos ou periódica/estanque.",
    )

    # Relacionamentos
    program: Mapped["GovernmentProgram"] = relationship(
        "GovernmentProgram",
        back_populates="indicators",
    )


class GovernmentAction(TenantEntityBase):
    """Ação Governamental (Projeto, Atividade ou Operação Especial) vinculada a um Programa."""

    __tablename__ = "planning_government_actions"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "program_id",
            "code",
            name="uq_planning_actions_tenant_program_code",
        ),
        Index("ix_planning_actions_tenant_unit", "tenant_id", "responsible_unit_code"),
    )

    program_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_government_programs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Programa Governamental ao qual a ação pertence.",
    )
    code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="Código funcional-programático da Ação (ex.: 1001 para Projeto, 2001 para Atividade).",
    )
    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
        comment="Título oficial da Ação Governamental.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Especificação detalhada do escopo da ação.",
    )
    action_type: Mapped[ActionType] = mapped_column(
        SAEnum(ActionType, name="action_type_enum", native_enum=False, length=30),
        nullable=False,
        comment="Tipo da ação: PROJETO, ATIVIDADE ou OPERACAO_ESPECIAL.",
    )
    responsible_unit_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        comment="Código da Unidade Orçamentária responsável (ex.: 02.04.01).",
    )
    responsible_unit_name: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
        comment="Nome da Secretaria / Unidade Orçamentária responsável.",
    )
    function_code: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        comment="Código da Função de Governo segundo Portaria MOG 42/1999 (ex.: 10 Saúde, 12 Educação).",
    )
    subfunction_code: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
        comment="Código da Subfunção de Governo (ex.: 301 Atenção Básica, 361 Ensino Fundamental).",
    )
    product_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Bem ou serviço resultante da ação (ex.: Creche Construída, Aluno Atendido).",
    )
    unit_of_measure: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Unidade de medida física do produto (ex.: Unidade, Aluno, m², Km).",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Indica se a ação está ativa para receber metas e dotações na LOA.",
    )

    # Relacionamentos
    program: Mapped["GovernmentProgram"] = relationship(
        "GovernmentProgram",
        back_populates="actions",
    )
    targets: Mapped[list["Target"]] = relationship(
        "Target",
        back_populates="action",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Target.year",
    )
    ldo_items: Mapped[list["LDOItem"]] = relationship(
        "LDOItem",
        back_populates="action",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Target(TenantEntityBase):
    """Meta Física e Financeira Anual de uma Ação Governamental para cada ano do PPA."""

    __tablename__ = "planning_targets"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "action_id",
            "year",
            name="uq_planning_targets_tenant_action_year",
        ),
        CheckConstraint(
            "physical_target >= 0 AND financial_target >= 0",
            name="targets_non_negative_planned",
        ),
        CheckConstraint(
            "executed_physical >= 0 AND executed_financial >= 0",
            name="targets_non_negative_executed",
        ),
    )

    action_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_government_actions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Ação Governamental à qual esta meta anual pertence.",
    )
    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Ano do quadriênio do PPA a que se refere a meta (ex.: 2026).",
    )
    physical_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
        default=Decimal("0.0000"),
        comment="Quantidade física programada para o exercício.",
    )
    financial_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Valor financeiro estimado em Reais (R$) para o exercício.",
    )
    executed_physical: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
        default=Decimal("0.0000"),
        comment="Quantidade física efetivamente realizada/apurada no monitoramento.",
    )
    executed_financial: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Valor financeiro efetivamente executado/liquidado (R$) no exercício.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Observações técnicas sobre a programação ou apuração da meta.",
    )

    # Relacionamentos
    action: Mapped["GovernmentAction"] = relationship(
        "GovernmentAction",
        back_populates="targets",
    )


class LDO(TenantEntityBase):
    """Lei de Diretrizes Orçamentárias (LDO) — Instrumento anual de conexão entre PPA e LOA."""

    __tablename__ = "planning_ldos"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "fiscal_year",
            name="uq_planning_ldos_tenant_fiscal_year",
        ),
        CheckConstraint(
            "fiscal_year >= 2000 AND fiscal_year <= 2100",
            name="ldo_valid_fiscal_year",
        ),
    )

    ppa_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_ppas.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="PPA vigente ao qual a LDO está subordinada.",
    )
    fiscal_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Exercício financeiro anual a que se refere a LDO (ex.: 2026).",
    )
    status: Mapped[LDOStatus] = mapped_column(
        SAEnum(LDOStatus, name="ldo_status_enum", native_enum=False, length=30),
        default=LDOStatus.ELABORACAO,
        nullable=False,
        comment="Status do ciclo anual da LDO.",
    )
    law_number: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
        comment="Número da Lei Municipal da LDO.",
    )
    law_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        comment="Data de sanção/publicação da LDO.",
    )
    primary_result_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0.00"),
        nullable=False,
        comment="Anexo de Metas Fiscais: Meta de Resultado Primário (R$).",
    )
    nominal_result_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0.00"),
        nullable=False,
        comment="Anexo de Metas Fiscais: Meta de Resultado Nominal (R$).",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Diretrizes gerais, prioridades e observações sobre riscos fiscais.",
    )

    # Relacionamentos
    ppa: Mapped["PPA"] = relationship("PPA", back_populates="ldos")
    items: Mapped[list["LDOItem"]] = relationship(
        "LDOItem",
        back_populates="ldo",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class LDOItem(TenantEntityBase):
    """Anexo de Metas e Prioridades da LDO — Ação do PPA priorizada para o exercício anual."""

    __tablename__ = "planning_ldo_items"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "ldo_id",
            "action_id",
            name="uq_planning_ldo_items_tenant_ldo_action",
        ),
        CheckConstraint(
            "adjusted_physical_target >= 0 AND adjusted_financial_target >= 0",
            name="ldo_items_non_negative_targets",
        ),
        CheckConstraint(
            "priority_level >= 1 AND priority_level <= 10",
            name="ldo_items_priority_range",
        ),
    )

    ldo_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_ldos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Referência à LDO anual.",
    )
    action_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_government_actions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Ação Governamental do PPA selecionada como prioridade para o ano.",
    )
    priority_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="Grau de prioridade na LDO (1 = Prioridade Máxima a 10).",
    )
    adjusted_physical_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False,
        comment="Meta física ajustada/fixada na LDO para o exercício financeiro.",
    )
    adjusted_financial_target: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        comment="Meta financeira ajustada/fixada na LDO (R$) para orientar a LOA.",
    )
    justification: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Justificativa técnica para priorização ou eventual revisão da meta do PPA.",
    )

    # Relacionamentos
    ldo: Mapped["LDO"] = relationship("LDO", back_populates="items")
    action: Mapped["GovernmentAction"] = relationship(
        "GovernmentAction",
        back_populates="ldo_items",
    )
