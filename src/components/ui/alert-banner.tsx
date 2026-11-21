import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  info: "bg-primary/10 border-primary/30 text-primary",
  avertissement: "bg-solar/10 border-solar/30 text-solar",
  critique: "bg-danger/10 border-danger/30 text-danger",
  urgence: "bg-danger/20 border-danger/50 text-danger",
};

export function AlertBanner({
  severity,
  title,
  message,
}: {
  severity: keyof typeof severityStyles;
  title: string;
  message: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", severityStyles[severity] ?? severityStyles.info)}>
      <p className="font-medium">{title}</p>
      <p className="text-white/70">{message}</p>
    </div>
  );
}
