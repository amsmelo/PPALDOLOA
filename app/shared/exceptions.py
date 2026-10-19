"""Exceções de domínio compartilhadas e tratadores HTTP para FastAPI."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DomainException(Exception):
    """Exceção base de regras de domínio."""

    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str, code: str = "DOMAIN_ERROR") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class EntityNotFoundError(DomainException):
    """Exceção lançada quando um recurso não é encontrado para o tenant atual."""

    status_code = status.HTTP_404_NOT_FOUND

    def __init__(self, entity_name: str, identifier: object) -> None:
        super().__init__(
            message=f"{entity_name} '{identifier}' não encontrado(a) para o município informado.",
            code="ENTITY_NOT_FOUND",
        )


class DuplicateEntityError(DomainException):
    """Exceção lançada quando há violação de unicidade de negócio no tenant."""

    status_code = status.HTTP_409_CONFLICT

    def __init__(self, message: str) -> None:
        super().__init__(message=message, code="DUPLICATE_ENTITY")


class BusinessRuleViolationError(DomainException):
    """Exceção lançada quando uma invariante fiscal ou de planejamento é violada."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, message: str) -> None:
        super().__init__(message=message, code="BUSINESS_RULE_VIOLATION")


def register_exception_handlers(app: FastAPI) -> None:
    """Registra os tratadores globais de exceções de domínio na aplicação FastAPI."""

    @app.exception_handler(DomainException)
    async def domain_exception_handler(
        _request: Request, exc: DomainException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.code,
                "detail": exc.message,
            },
        )
