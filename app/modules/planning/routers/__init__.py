"""Roteador agregador do Módulo 1: Planejamento Municipal."""

from fastapi import APIRouter

from app.modules.planning.routers.ppa_router import router as ppa_router
from app.modules.planning.routers.program_router import router as program_router

planning_router = APIRouter(prefix="/planning")
planning_router.include_router(ppa_router)
planning_router.include_router(program_router)

__all__ = ["planning_router", "ppa_router", "program_router"]
