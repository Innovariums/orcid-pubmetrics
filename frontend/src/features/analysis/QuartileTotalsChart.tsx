import { Doughnut } from "react-chartjs-2";
import type { AnalysisResult } from "../../types";
import { QUARTILE_COLORS, QUARTILE_LABELS } from "../../types";

export function QuartileTotalsChart({ result }: { result: AnalysisResult }) {
  const t = result.quartile_totals;
  const entries: Array<["Q1" | "Q2" | "Q3" | "Q4" | "unindexed", number]> = [
    ["Q1", t.q1],
    ["Q2", t.q2],
    ["Q3", t.q3],
    ["Q4", t.q4],
    ["unindexed", t.unindexed],
  ];

  return (
    <Doughnut
      data={{
        labels: entries.map(([k]) => QUARTILE_LABELS[k]),
        datasets: [
          {
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(([k]) => QUARTILE_COLORS[k]),
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        cutout: "55%",
      }}
    />
  );
}
