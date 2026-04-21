from app.ports.journal_metrics import JournalMetric, JournalMetricsProvider, MetricsSource


class ClarivateJcrProvider:
    """
    Cuartil y JIF vía Clarivate Web of Science Journals API.

    Requiere suscripción institucional a JCR o InCites. Se implementa en Fase 4
    cuando la Universidad de Córdoba active el add-on de API.

    Al escribirse, debe pasar el mismo suite de tests de contrato que
    ScimagoSjrProvider (ver tests/contract/test_journal_metrics_provider.py).
    """

    name: MetricsSource = "jcr"

    def __init__(self, api_key: str, api_base: str) -> None:
        self.api_key = api_key
        self.api_base = api_base

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        if not self.api_key:
            raise RuntimeError(
                "JCR_API_KEY no configurado. "
                "Esta ruta requiere suscripción institucional activa."
            )
        raise NotImplementedError("Fase 4: implementar cuando haya API key Clarivate")

    def health(self) -> bool:
        return bool(self.api_key)


_: JournalMetricsProvider = ClarivateJcrProvider(api_key="", api_base="")
