import { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";
import type { Quartile } from "../types";

export type ChipKind = Quartile | "unindexed";

export const QUARTILE_LABEL: Record<ChipKind, string> = {
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
  unindexed: "Sin indexar",
};

/* Chip Q1-Q4 / unindexed */
export function Chip({
  q,
  children,
  size = "md",
}: {
  q: ChipKind;
  children?: ReactNode;
  size?: "sm" | "md";
}) {
  const cls = q === "unindexed" ? "op-chip op-chip--none" : `op-chip op-chip--${q.toLowerCase()}`;
  const sized: CSSProperties | undefined =
    size === "sm" ? { height: 20, fontSize: 10.5, padding: "0 7px" } : undefined;
  return (
    <span className={cls} style={sized}>
      <span className="op-chip__dot" />
      {children ?? QUARTILE_LABEL[q]}
    </span>
  );
}

/* Button */
type BtnVariant = "primary" | "secondary" | "ghost";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: BtnVariant;
  size?: BtnSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Btn({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  children,
  type = "button",
  ...rest
}: BtnProps) {
  const cls = ["op-btn", `op-btn--${variant}`, size !== "md" ? `op-btn--${size}` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

/* Card */
export function Card({
  title,
  subtitle,
  right,
  children,
  pad = true,
  style,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  pad?: boolean;
  style?: CSSProperties;
}) {
  const hasHeader = title || right;
  return (
    <section className="op-card" style={style}>
      {hasHeader && (
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "14px 18px 0",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && <h3 className="t-h2" style={{ margin: 0 }}>{title}</h3>}
            {subtitle && <div className="t-small" style={{ marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </header>
      )}
      <div style={{ padding: pad ? 18 : 0 }}>{children}</div>
    </section>
  );
}

/* StatCard */
export type StatTone = "q1" | "q2" | "q3" | "q4" | "none";

export function StatCard({
  label,
  value,
  tone,
  hint,
  footer,
}: {
  label: string;
  value: number | string;
  tone?: StatTone;
  hint?: ReactNode;
  footer?: ReactNode;
}) {
  const color =
    tone === "q1"
      ? "var(--q1)"
      : tone === "q2"
      ? "var(--q2)"
      : tone === "q3"
      ? "var(--q3)"
      : tone === "q4"
      ? "var(--q4)"
      : tone === "none"
      ? "var(--q-none)"
      : "var(--ink-900)";
  return (
    <div
      className="op-card"
      style={{
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div className="t-tiny" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {tone && (
          <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
        )}
        {label}
      </div>
      <div className="t-stat" style={{ color }}>
        {value}
      </div>
      {hint && <div className="t-small">{hint}</div>}
      {footer}
    </div>
  );
}

/* Icons — minimal stroke set */
const svg = (s: number) => ({ width: s, height: s, fill: "none" as const });

export const Icon = {
  arrowRight: (s = 16) => (
    <svg {...svg(s)} viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
  arrowLeft: (s = 16) => (
    <svg {...svg(s)} viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  ),
  download: (s = 16) => (
    <svg {...svg(s)} viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8M4.5 7L8 10.5 11.5 7M2.5 13h11" />
    </svg>
  ),
  external: (s = 14) => (
    <svg {...svg(s)} viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3v8h8V8M8 2h4v4M12 2l-5 5" />
    </svg>
  ),
  info: (s = 14) => (
    <svg {...svg(s)} viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 6.5v3M7 4.5v.01" strokeLinecap="round" />
    </svg>
  ),
  close: (s = 16) => (
    <svg {...svg(s)} viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  ),
  plus: (s = 14) => (
    <svg {...svg(s)} viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M7 2v10M2 7h10" />
    </svg>
  ),
  search: (s = 14) => (
    <svg {...svg(s)} viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="6" cy="6" r="4" />
      <path d="M9 9l3 3" />
    </svg>
  ),
  check: (s = 14) => (
    <svg {...svg(s)} viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7.5l3 3 6-7" />
    </svg>
  ),
  spinner: (s = 14) => (
    <svg
      {...svg(s)}
      viewBox="0 0 14 14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ animation: "op-spin 1s linear infinite" }}
    >
      <path d="M7 1.5a5.5 5.5 0 1 1-5.5 5.5" />
    </svg>
  ),
  dot: () => (
    <span
      style={{
        display: "inline-block",
        width: 3,
        height: 3,
        borderRadius: 1.5,
        background: "var(--ink-300)",
        margin: "0 6px",
        verticalAlign: "middle",
      }}
    />
  ),
  logo: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="20" height="20" rx="4" fill="#0E1116" />
      <path
        d="M6 14.5V7.5M6 7.5L11 12.5L16 7.5M16 7.5V14.5"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="16.5" r="1" fill="#1F9D55" />
    </svg>
  ),
};

/* Tiny sparkline */
export function Sparkline({
  values,
  color = "var(--accent)",
  width = 80,
  height = 24,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
