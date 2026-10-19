"""Fixtures assíncronas do Pytest para testes de integração do Módulo de Planejamento."""

from collections.abc import AsyncGenerator
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import get_db_session
from app.main import app
from app.shared.models import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection: object, _connection_record: object) -> None:
    """Garante integridade referencial de chaves estrangeiras em banco de teste SQLite."""
    cursor = getattr(dbapi_connection, "cursor", None)
    if callable(cursor):
        cur = cursor()
        try:
            cur.execute("PRAGMA foreign_keys=ON")
        except Exception:
            pass
        finally:
            cur.close()


@pytest.fixture
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    engine = create_async_engine(TEST_DATABASE_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def tenant_a_id() -> UUID:
    """Município A (ex.: Prefeitura Municipal de São Bento)."""
    return uuid4()


@pytest.fixture
def tenant_b_id() -> UUID:
    """Município B (ex.: Prefeitura Municipal de Santa Luzia)."""
    return uuid4()
