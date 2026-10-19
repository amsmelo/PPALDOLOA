"""Initial schema for Planning Module (PPA, Strategic Axes, Objectives, Programs, Indicators, Actions, Targets, LDO).

Revision ID: 0001_initial_planning
Revises:
Create Date: 2026-10-17 13:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_planning"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "planning_ppas",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
        sa.Column("end_year", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("law_number", sa.String(length=60), nullable=True),
        sa.Column("law_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "end_year = start_year + 3",
            name=op.f("ck_planning_ppas_ppa_quadrennial_period"),
        ),
        sa.CheckConstraint(
            "start_year >= 2000 AND start_year <= 2100",
            name=op.f("ck_planning_ppas_ppa_valid_start_year"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_ppas")),
        sa.UniqueConstraint(
            "tenant_id",
            "start_year",
            "end_year",
            name="uq_planning_ppas_tenant_period",
        ),
    )
    op.create_index(
        op.f("ix_planning_ppas_tenant_id"),
        "planning_ppas",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_planning_ppas_tenant_status",
        "planning_ppas",
        ["tenant_id", "status"],
        unique=False,
    )

    op.create_table(
        "planning_strategic_axes",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("ppa_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["ppa_id"],
            ["planning_ppas.id"],
            name=op.f("fk_planning_strategic_axes_ppa_id_planning_ppas"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_strategic_axes")),
        sa.UniqueConstraint(
            "tenant_id",
            "ppa_id",
            "code",
            name="uq_planning_axes_tenant_ppa_code",
        ),
    )
    op.create_index(
        op.f("ix_planning_strategic_axes_ppa_id"),
        "planning_strategic_axes",
        ["ppa_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_strategic_axes_tenant_id"),
        "planning_strategic_axes",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "planning_strategic_objectives",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("axis_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["axis_id"],
            ["planning_strategic_axes.id"],
            name=op.f("fk_planning_strategic_objectives_axis_id_planning_strategic_axes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_strategic_objectives")),
        sa.UniqueConstraint(
            "tenant_id",
            "axis_id",
            "code",
            name="uq_planning_objectives_tenant_axis_code",
        ),
    )
    op.create_index(
        op.f("ix_planning_strategic_objectives_axis_id"),
        "planning_strategic_objectives",
        ["axis_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_strategic_objectives_tenant_id"),
        "planning_strategic_objectives",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "planning_government_programs",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("ppa_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("objective_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("target_audience", sa.String(length=250), nullable=False),
        sa.Column("program_type", sa.String(length=30), nullable=False),
        sa.Column("responsible_unit", sa.String(length=150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["objective_id"],
            ["planning_strategic_objectives.id"],
            name=op.f(
                "fk_planning_government_programs_objective_id_planning_strategic_objectives"
            ),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["ppa_id"],
            ["planning_ppas.id"],
            name=op.f("fk_planning_government_programs_ppa_id_planning_ppas"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_government_programs")),
        sa.UniqueConstraint(
            "tenant_id",
            "ppa_id",
            "code",
            name="uq_planning_programs_tenant_ppa_code",
        ),
    )
    op.create_index(
        op.f("ix_planning_government_programs_objective_id"),
        "planning_government_programs",
        ["objective_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_government_programs_ppa_id"),
        "planning_government_programs",
        ["ppa_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_government_programs_tenant_id"),
        "planning_government_programs",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_planning_programs_tenant_type",
        "planning_government_programs",
        ["tenant_id", "program_type"],
        unique=False,
    )

    op.create_table(
        "planning_indicators",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("program_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("unit_of_measure", sa.String(length=50), nullable=False),
        sa.Column("formula", sa.Text(), nullable=False),
        sa.Column("periodicity", sa.String(length=30), nullable=False),
        sa.Column("baseline_value", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("baseline_date", sa.Date(), nullable=True),
        sa.Column("target_value", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("is_cumulative", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["planning_government_programs.id"],
            name=op.f("fk_planning_indicators_program_id_planning_government_programs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_indicators")),
        sa.UniqueConstraint(
            "tenant_id",
            "program_id",
            "code",
            name="uq_planning_indicators_tenant_program_code",
        ),
    )
    op.create_index(
        op.f("ix_planning_indicators_program_id"),
        "planning_indicators",
        ["program_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_indicators_tenant_id"),
        "planning_indicators",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "planning_government_actions",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("program_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("action_type", sa.String(length=30), nullable=False),
        sa.Column("responsible_unit_code", sa.String(length=30), nullable=False),
        sa.Column("responsible_unit_name", sa.String(length=180), nullable=False),
        sa.Column("function_code", sa.String(length=4), nullable=False),
        sa.Column("subfunction_code", sa.String(length=4), nullable=False),
        sa.Column("product_name", sa.String(length=150), nullable=False),
        sa.Column("unit_of_measure", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["planning_government_programs.id"],
            name=op.f("fk_planning_government_actions_program_id_planning_government_programs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_government_actions")),
        sa.UniqueConstraint(
            "tenant_id",
            "program_id",
            "code",
            name="uq_planning_actions_tenant_program_code",
        ),
    )
    op.create_index(
        op.f("ix_planning_government_actions_program_id"),
        "planning_government_actions",
        ["program_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_government_actions_tenant_id"),
        "planning_government_actions",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_planning_actions_tenant_unit",
        "planning_government_actions",
        ["tenant_id", "responsible_unit_code"],
        unique=False,
    )

    op.create_table(
        "planning_targets",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("action_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("physical_target", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("financial_target", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("executed_physical", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("executed_financial", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "physical_target >= 0 AND financial_target >= 0",
            name=op.f("ck_planning_targets_targets_non_negative_planned"),
        ),
        sa.CheckConstraint(
            "executed_physical >= 0 AND executed_financial >= 0",
            name=op.f("ck_planning_targets_targets_non_negative_executed"),
        ),
        sa.ForeignKeyConstraint(
            ["action_id"],
            ["planning_government_actions.id"],
            name=op.f("fk_planning_targets_action_id_planning_government_actions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_targets")),
        sa.UniqueConstraint(
            "tenant_id",
            "action_id",
            "year",
            name="uq_planning_targets_tenant_action_year",
        ),
    )
    op.create_index(
        op.f("ix_planning_targets_action_id"),
        "planning_targets",
        ["action_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_targets_tenant_id"),
        "planning_targets",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "planning_ldos",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("ppa_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("law_number", sa.String(length=60), nullable=True),
        sa.Column("law_date", sa.Date(), nullable=True),
        sa.Column("primary_result_target", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("nominal_result_target", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "fiscal_year >= 2000 AND fiscal_year <= 2100",
            name=op.f("ck_planning_ldos_ldo_valid_fiscal_year"),
        ),
        sa.ForeignKeyConstraint(
            ["ppa_id"],
            ["planning_ppas.id"],
            name=op.f("fk_planning_ldos_ppa_id_planning_ppas"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_ldos")),
        sa.UniqueConstraint(
            "tenant_id",
            "fiscal_year",
            name="uq_planning_ldos_tenant_fiscal_year",
        ),
    )
    op.create_index(
        op.f("ix_planning_ldos_ppa_id"),
        "planning_ldos",
        ["ppa_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_ldos_tenant_id"),
        "planning_ldos",
        ["tenant_id"],
        unique=False,
    )

    op.create_table(
        "planning_ldo_items",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("ldo_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("action_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("priority_level", sa.Integer(), nullable=False),
        sa.Column("adjusted_physical_target", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("adjusted_financial_target", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("justification", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "adjusted_physical_target >= 0 AND adjusted_financial_target >= 0",
            name=op.f("ck_planning_ldo_items_ldo_items_non_negative_targets"),
        ),
        sa.CheckConstraint(
            "priority_level >= 1 AND priority_level <= 10",
            name=op.f("ck_planning_ldo_items_ldo_items_priority_range"),
        ),
        sa.ForeignKeyConstraint(
            ["action_id"],
            ["planning_government_actions.id"],
            name=op.f("fk_planning_ldo_items_action_id_planning_government_actions"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["ldo_id"],
            ["planning_ldos.id"],
            name=op.f("fk_planning_ldo_items_ldo_id_planning_ldos"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_planning_ldo_items")),
        sa.UniqueConstraint(
            "tenant_id",
            "ldo_id",
            "action_id",
            name="uq_planning_ldo_items_tenant_ldo_action",
        ),
    )
    op.create_index(
        op.f("ix_planning_ldo_items_action_id"),
        "planning_ldo_items",
        ["action_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_ldo_items_ldo_id"),
        "planning_ldo_items",
        ["ldo_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_planning_ldo_items_tenant_id"),
        "planning_ldo_items",
        ["tenant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("planning_ldo_items")
    op.drop_table("planning_ldos")
    op.drop_table("planning_targets")
    op.drop_table("planning_government_actions")
    op.drop_table("planning_indicators")
    op.drop_table("planning_government_programs")
    op.drop_table("planning_strategic_objectives")
    op.drop_table("planning_strategic_axes")
    op.drop_table("planning_ppas")
