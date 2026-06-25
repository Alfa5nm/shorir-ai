import type { ReactNode } from "react";

export function StatusPill({
  tone,
  children
}: {
  tone: "neutral" | "success" | "warning";
  children: ReactNode;
}) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}
