from app.ports.editorial_boards import EditorialBoardProvider, EditorialMember


class OpenEditorsProvider:
    """
    Datos de comités editoriales desde el dataset Open Editors (Zenodo).

    Dataset: ~594k posiciones editoriales de 7.3k revistas de 26 editoriales
    grandes (Elsevier, Springer, Wiley, Taylor & Francis, SAGE, etc.).
    Se implementa en Fase 2.
    """

    name: str = "open_editors"

    def __init__(self, data_path: str) -> None:
        self.data_path = data_path

    def get_members_by_issn(self, issn: str) -> list[EditorialMember]:
        raise NotImplementedError("Fase 2: cargar CSV Open Editors en DF + lookup por ISSN")

    def find_journals_by_researcher(
        self, orcid: str | None = None, name: str | None = None
    ) -> list[EditorialMember]:
        raise NotImplementedError("Fase 2: lookup por orcid o name con normalización")

    def health(self) -> bool:
        import os

        return os.path.isfile(self.data_path)


_: EditorialBoardProvider = OpenEditorsProvider(data_path="/tmp/dataset.csv")
