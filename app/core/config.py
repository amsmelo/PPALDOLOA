"""Configurações globais da aplicação utilizando Pydantic Settings v2."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações carregadas a partir de variáveis de ambiente ou arquivo .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(
        default="GovTech - Gestão de Planejamento, Orçamento e Finanças (PPA/LDO/LOA)",
        description="Nome oficial da API exibido na documentação OpenAPI.",
    )
    app_version: str = Field(default="0.1.0")
    environment: Literal["development", "staging", "production", "testing"] = Field(
        default="development"
    )
    debug: bool = Field(default=False)
    api_v1_prefix: str = Field(default="/api/v1")

    database_url: str = Field(
        default="postgresql+asyncpg://govtech:govtech_secret@localhost:5432/ppaldoloa_db",
        description="String de conexão assíncrona SQLAlchemy 2.0 (asyncpg).",
    )
    db_echo: bool = Field(default=False, description="Habilita log de queries SQL.")
    db_pool_size: int = Field(default=10)
    db_max_overflow: int = Field(default=20)

    cors_origins: list[str] = Field(default=["*"])


@lru_cache
def get_settings() -> Settings:
    """Retorna instância singleton (cached) das configurações."""
    return Settings()


settings = get_settings()
