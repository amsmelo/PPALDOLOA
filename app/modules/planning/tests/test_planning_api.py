"""Testes de integração da API RESTful do Módulo 1: Planejamento Municipal (PPA, Programas, Ações e LDO)."""

from uuid import UUID

import pytest
from httpx import AsyncClient

from app.modules.planning.tests.factories import (
    GovernmentProgramFactory,
    PPAFactory,
)


@pytest.mark.asyncio
async def test_ppa_crud_and_quadrennial_validation(
    client: AsyncClient,
    tenant_a_id: UUID,
) -> None:
    headers = {"X-Tenant-ID": str(tenant_a_id)}

    # 1. Tentativa de criar PPA com período inválido (não quadrienal) deve retornar 422
    invalid_payload = {
        "name": "PPA Inválido 2026-2028",
        "start_year": 2026,
        "end_year": 2028,
    }
    resp_invalid = await client.post(
        "/api/v1/planning/ppas", json=invalid_payload, headers=headers
    )
    assert resp_invalid.status_code == 422

    # 2. Criação válida de PPA quadrienal (2026-2029) usando dados da PPAFactory
    ppa_sample = PPAFactory.build(tenant_id=tenant_a_id, start_year=2026, end_year=2029)
    create_payload = {
        "name": ppa_sample.name,
        "start_year": ppa_sample.start_year,
        "end_year": ppa_sample.end_year,
        "status": "ELABORACAO",
        "description": ppa_sample.description,
    }
    resp_create = await client.post(
        "/api/v1/planning/ppas", json=create_payload, headers=headers
    )
    assert resp_create.status_code == 201
    created_ppa = resp_create.json()
    ppa_id = created_ppa["id"]
    assert created_ppa["tenant_id"] == str(tenant_a_id)
    assert created_ppa["start_year"] == 2026
    assert created_ppa["end_year"] == 2029

    # 3. Listagem filtrada por ano de referência (2027 está dentro de 2026-2029)
    resp_list = await client.get(
        "/api/v1/planning/ppas?reference_year=2027", headers=headers
    )
    assert resp_list.status_code == 200
    assert resp_list.json()["total"] == 1

    # 4. Atualização de status para APROVADO informando a Lei Municipal
    resp_patch = await client.patch(
        f"/api/v1/planning/ppas/{ppa_id}",
        json={
            "status": "APROVADO",
            "law_number": "Lei Municipal nº 890/2025",
            "law_date": "2025-11-20",
        },
        headers=headers,
    )
    assert resp_patch.status_code == 200
    assert resp_patch.json()["status"] == "APROVADO"
    assert resp_patch.json()["law_number"] == "Lei Municipal nº 890/2025"

    # 5. Exclusão bloqueada quando o PPA não está mais EM ELABORAÇÃO
    resp_del_blocked = await client.delete(
        f"/api/v1/planning/ppas/{ppa_id}", headers=headers
    )
    assert resp_del_blocked.status_code == 422


@pytest.mark.asyncio
async def test_multitenant_isolation_between_municipalities(
    client: AsyncClient,
    tenant_a_id: UUID,
    tenant_b_id: UUID,
) -> None:
    headers_a = {"X-Tenant-ID": str(tenant_a_id)}
    headers_b = {"X-Tenant-ID": str(tenant_b_id)}

    resp = await client.post(
        "/api/v1/planning/ppas",
        json={
            "name": "PPA 2026-2029 - Município A",
            "start_year": 2026,
            "end_year": 2029,
        },
        headers=headers_a,
    )
    assert resp.status_code == 201
    ppa_a_id = resp.json()["id"]

    # Município B não deve enxergar o PPA do Município A
    resp_get_b = await client.get(
        f"/api/v1/planning/ppas/{ppa_a_id}", headers=headers_b
    )
    assert resp_get_b.status_code == 404

    resp_list_b = await client.get("/api/v1/planning/ppas", headers=headers_b)
    assert resp_list_b.status_code == 200
    assert resp_list_b.json()["total"] == 0


@pytest.mark.asyncio
async def test_full_planning_chain_programs_actions_targets_and_ldo(
    client: AsyncClient,
    tenant_a_id: UUID,
) -> None:
    headers = {"X-Tenant-ID": str(tenant_a_id)}

    # 1. Cria o PPA 2026-2029
    ppa_resp = await client.post(
        "/api/v1/planning/ppas",
        json={
            "name": "PPA 2026-2029 - Desenvolvimento Municipal",
            "start_year": 2026,
            "end_year": 2029,
        },
        headers=headers,
    )
    ppa_id = ppa_resp.json()["id"]

    # 2. Cria Eixo Estratégico e Objetivo Estratégico
    axis_resp = await client.post(
        "/api/v1/planning/ppas/axes",
        json={
            "ppa_id": ppa_id,
            "code": "EIXO-01",
            "name": "Educação, Cultura e Desenvolvimento Social",
        },
        headers=headers,
    )
    assert axis_resp.status_code == 201
    axis_id = axis_resp.json()["id"]

    obj_resp = await client.post(
        "/api/v1/planning/ppas/objectives",
        json={
            "axis_id": axis_id,
            "code": "OBJ-01.01",
            "title": "Ampliar a oferta de Educação Infantil em tempo integral",
        },
        headers=headers,
    )
    assert obj_resp.status_code == 201
    objective_id = obj_resp.json()["id"]

    # 3. Cria Programa Governamental completo com Indicador, Ação e Metas de 4 anos
    prog_sample = GovernmentProgramFactory.build(
        tenant_id=tenant_a_id,
        code="0012",
        title="Educação Básica Transformadora",
    )
    program_payload = {
        "ppa_id": ppa_id,
        "objective_id": objective_id,
        "code": prog_sample.code,
        "title": prog_sample.title,
        "justification": prog_sample.justification,
        "target_audience": prog_sample.target_audience,
        "program_type": "TEMATICO",
        "responsible_unit": "Secretaria Municipal de Educação",
        "indicators": [
            {
                "code": "IND-EDU-01",
                "name": "Taxa de Atendimento em Creches",
                "unit_of_measure": "Percentual (%)",
                "formula": "(Matrículas / Demanda Manifesta) * 100",
                "periodicity": "ANUAL",
                "baseline_value": "45.0000",
                "target_value": "80.0000",
                "is_cumulative": False,
            }
        ],
        "actions": [
            {
                "code": "1001",
                "title": "Construção de Creches Municipais Tipo B",
                "action_type": "PROJETO",
                "responsible_unit_code": "02.05.01",
                "responsible_unit_name": "Fundo Municipal de Educação",
                "function_code": "12",
                "subfunction_code": "365",
                "product_name": "Creche Construída",
                "unit_of_measure": "Unidade",
                "targets": [
                    {"year": 2026, "physical_target": "1.0000", "financial_target": "1200000.00"},
                    {"year": 2027, "physical_target": "1.0000", "financial_target": "1300000.00"},
                    {"year": 2028, "physical_target": "2.0000", "financial_target": "2600000.00"},
                    {"year": 2029, "physical_target": "1.0000", "financial_target": "1400000.00"},
                ],
            }
        ],
    }
    prog_resp = await client.post(
        "/api/v1/planning/programs", json=program_payload, headers=headers
    )
    assert prog_resp.status_code == 201
    program_data = prog_resp.json()
    program_id = program_data["id"]
    assert len(program_data["indicators"]) == 1
    assert len(program_data["actions"]) == 1
    assert len(program_data["actions"][0]["targets"]) == 4
    action_id = program_data["actions"][0]["id"]

    # 4. Atualiza dados do Programa Governamental
    patch_resp = await client.patch(
        f"/api/v1/planning/programs/{program_id}",
        json={"title": "Educação Básica Transformadora e Inclusiva"},
        headers=headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Educação Básica Transformadora e Inclusiva"

    # 5. Cria LDO para 2026 vinculando a Ação Prioritária com meta ajustada
    ldo_resp = await client.post(
        "/api/v1/planning/programs/ldos",
        json={
            "ppa_id": ppa_id,
            "fiscal_year": 2026,
            "status": "ELABORACAO",
            "primary_result_target": "350000.00",
            "nominal_result_target": "200000.00",
            "items": [
                {
                    "action_id": action_id,
                    "priority_level": 1,
                    "adjusted_physical_target": "1.0000",
                    "adjusted_financial_target": "1250000.00",
                    "justification": "Reajuste do CUB/SINAPI previsto para o exercício de 2026.",
                }
            ],
        },
        headers=headers,
    )
    assert ldo_resp.status_code == 201
    ldo_data = ldo_resp.json()
    assert ldo_data["fiscal_year"] == 2026
    assert len(ldo_data["items"]) == 1
    assert ldo_data["items"][0]["adjusted_financial_target"] == "1250000.00"
