from typing import Literal, Protocol, runtime_checkable

from pydantic import BaseModel, Field

Quartile = Literal["Q1", "Q2", "Q3", "Q4"]
MetricsSource = Literal["sjr", "jcr"]
YearRule = Literal["exact", "fallback-1", "fallback+1", "fallback-any"]


class JournalMetric(BaseModel):
    """Métrica de una revista para un año concreto. Fuente-agnóstica."""

    issn: str = Field(description="ISSN normalizado sin guión, 8 dígitos")
    year: int
    source: MetricsSource
    score: float = Field(description="SJR score (si source=sjr) o JIF (si source=jcr)")
    score_label: str = Field(description='Etiqueta para UI: "SJR" o "JIF"')
    quartile: Quartile
    category: str
    category_rank: int | None = None
    category_total: int | None = None
    year_rule: YearRule = "exact"


@runtime_checkable
class JournalMetricsProvider(Protocol):
    """
    Contrato que todo proveedor de métricas de revista debe cumplir.

    Cambiar SJR → JCR consiste únicamente en escribir una implementación nueva
    de este protocolo. Todo el dominio, la API y el frontend son agnósticos.
    """

    name: MetricsSource

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        """
        Devuelve todas las métricas disponibles para la revista en ese año.

        Una revista puede tener múltiples entradas si aparece en varias
        categorías. El consumidor decide qué política de display aplica
        (mejor cuartil, todas, etc.).

        Si no hay datos exactos del año, intenta fallback ±1 e indica la
        regla usada en `JournalMetric.year_rule`.

        Devuelve lista vacía si la revista no se encontró. Nunca None.
        """
        ...

    def health(self) -> bool:
        """Smoke check: el provider está listo para responder."""
        ...
