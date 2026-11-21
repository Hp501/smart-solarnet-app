import type { LoadPriority } from "@/types/database.types";

const STYLES: Record<LoadPriority, string> = {
  critique: "bg-danger/15 text-danger",
  important: "bg-solar/15 text-solar",
  normal: "bg-primary/15 text-primary",
  secondaire: "bg-white/10 text-muted",
};

const LABELS: Record<LoadPriority, string> = {
  critique: "Critique",
  important: "Important",
  normal: "Normal",
  secondaire: "Secondaire",
};

export function PriorityBadge({ priority }: { priority: LoadPriority }) {
  return <span className={`rounded-full px-3 py-1 text-xs ${STYLES[priority]}`}>{LABELS[priority]}</span>;
}
