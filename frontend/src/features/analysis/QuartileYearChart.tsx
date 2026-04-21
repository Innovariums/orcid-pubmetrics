import { Bar } from "react-chartjs-2";
import type { AnalysisResult } from "../../types";
import { QUARTILE_COLORS, QUARTILE_LABELS } from "../../types";

export function QuartileYearChart({ result }: { result: AnalysisResult }) {
  const labels = result.by_year_quartile.map((b) => String(b.year));
  const makeDataset = (key: "q1" | "q2" | "q3" | "q4" | "unindexed", label: string, color: string) => ({
    label,
    data: result.by_year_quartile.map((b) => b[key]),
    backgroundColor: color,
    borderWidth: 0,
  });

  return (
    <Bar
      data={{
        labels,
        datasets: [
          makeDataset("q1", QUARTILE_LABELS.Q1, QUARTILE_COLORS.Q1),
          makeDataset("q2", QUARTILE_LABELS.Q2, QUARTILE_COLORS.Q2),
          makeDataset("q3", QUARTILE_LABELS.Q3, QUARTILE_COLORS.Q3),
          makeDataset("q4", QUARTILE_LABELS.Q4, QUARTILE_COLORS.Q4),
          makeDataset("unindexed", QUARTILE_LABELS.unindexed, QUARTILE_COLORS.unindexed),
        ],
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "#f1f5f9" },
          },
        },
      }}
    />
  );
}
