import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

ChartJS.defaults.font.family =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
ChartJS.defaults.color = "#334155";
