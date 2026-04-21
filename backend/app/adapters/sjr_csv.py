from app.ports.journal_metrics import JournalMetric, JournalMetricsProvider, MetricsSource


class ScimagoSjrProvider:
    """
    Cuartil y SJR score leídos de CSVs anuales descargados de scimagojr.com.

    Los CSVs se guardan en `data_dir` con formato `scimagojr {year}.csv`
    (el nombre que Scimago usa por defecto). Se implementa en Fase 1.
    """

    name: MetricsSource = "sjr"

    def __init__(self, data_dir: str) -> None:
        self.data_dir = data_dir

    def get_metrics(self, issn: str, year: int) -> list[JournalMetric]:
        raise NotImplementedError("Fase 1: cargar CSVs SJR en DF y lookup por ISSN+año")

    def health(self) -> bool:
        import os

        return os.path.isdir(self.data_dir)


_: JournalMetricsProvider = ScimagoSjrProvider(data_dir="/tmp")
