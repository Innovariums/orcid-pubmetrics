import { Line } from "react-chartjs-2";
import type { AnalysisResult } from "../../types";

export function ScoreEvolutionChart({ result }: { result: AnalysisResult }) {
  const scoreLabel = result.metrics_source.toUpperCase();
  const points = result.score_evolution;

  return (
    <Line
      data={{
        labels: points.map((p) => String(p.year)),
        datasets: [
          {
            label: `${scoreLabel} promedio`,
            data: points.map((p) => p.avg_score),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.15)",
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => `n=${points[ctx.dataIndex].count}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
        },
      }}
    />
  );
}
