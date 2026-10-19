"""Configuração de engine e sessão assíncrona do SQLAlchemy 2.0."""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings


def build_async_engine(database_url: str | None = None) -> AsyncEngine:
    """Cria uma instância de AsyncEngine configurada para o banco alvo."""
    target_url = database_url or settings.database_url
    engine_kwargs: dict[str, Any] = {
        "echo": settings.db_echo,
        "future": True,
    }
    if not target_url.startswith("sqlite"):
        engine_kwargs.update(
            {
                "pool_pre_ping": True,
                "pool_size": settings.db_pool_size,
                "max_overflow": settings.db_max_overflow,
            }
        )
    return create_async_engine(target_url, **engine_kwargs)


engine: AsyncEngine = build_async_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provedor de sessão assíncrona do banco de dados para rotas FastAPI."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
