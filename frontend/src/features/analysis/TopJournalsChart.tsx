import { Bar } from "react-chartjs-2";
import type { AnalysisResult } from "../../types";

export function TopJournalsChart({ result }: { result: AnalysisResult }) {
  const rows = result.top_journals.slice(0, 10);

  return (
    <Bar
      data={{
        labels: rows.map((r) => truncate(r.title, 40)),
        datasets: [
          {
            label: "Publicaciones",
            data: rows.map((r) => r.count),
            backgroundColor: "#2563eb",
            borderWidth: 0,
          },
        ],
      }}
      options={{
        indexAxis: "y",
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#f1f5f9" } },
          y: { grid: { display: false } },
        },
      }}
    />
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
