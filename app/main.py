"""Ponto de entrada da aplicação FastAPI — Ecossistema GovTech PPA, LDO e LOA."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.modules.planning.routers import planning_router
from app.shared.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Gerencia o ciclo de vida da aplicação e o encerramento seguro do pool de conexões."""
    yield
    await engine.dispose()


def create_application() -> FastAPI:
    """Factory de criação e configuração da instância FastAPI."""
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "API Backend (Monólito Modular) para Gestão de Planejamento, Orçamento e "
            "Finanças Públicas Municipais (PPA, LDO, LOA, Execução e Transparência)."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)

    @application.get("/health", tags=["Infraestrutura"], summary="Healthcheck da API")
    async def healthcheck() -> dict[str, str]:
        return {
            "status": "ok",
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }

    # Registro dos módulos de domínio
    application.include_router(planning_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()
