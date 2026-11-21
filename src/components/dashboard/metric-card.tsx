import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  unit,
  accent = "primary",
  href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: "primary" | "solar" | "energy" | "danger";
  href?: string;
}) {
  const accentClass = {
    primary: "text-primary",
    solar: "text-solar",
    energy: "text-energy",
    danger: "text-danger",
  }[accent];

  const content = (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <p className={`text-3xl font-semibold ${accentClass}`}>
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted">{unit}</span>}
      </p>
    </Card>
  );

  return href ? <Link href={href} className="block transition hover:scale-[1.01]">{content}</Link> : content;
}
